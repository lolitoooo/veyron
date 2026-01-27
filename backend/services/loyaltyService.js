const LoyaltyConfig = require('../models/LoyaltyConfig');
const LoyaltyWallet = require('../models/LoyaltyWallet');
const LoyaltyLedger = require('../models/LoyaltyLedger');
const mongoose = require('mongoose');

async function getOrCreateConfig() {
  let config = await LoyaltyConfig.findOne();
  if (!config) {
    config = await LoyaltyConfig.create({});
  }
  return config;
}

async function getOrCreateWallet(userId) {
  let wallet = await LoyaltyWallet.findOne({ user: userId });
  if (!wallet) {
    wallet = await LoyaltyWallet.create({
      user: userId,
      xpTotal: 0,
      rank: 'Bronze',
      badges: []
    });
  }
  return wallet;
}

async function calculateCashbackBalance(userId) {
  const now = new Date();
  const userObjectId = new mongoose.Types.ObjectId(userId);
  
  const earned = await LoyaltyLedger.aggregate([
    {
      $match: {
        user: userObjectId,
        type: 'CASHBACK_EARN',
        $or: [
          { expiresAt: { $exists: false } },
          { expiresAt: { $gt: now } }
        ]
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' }
      }
    }
  ]);

  const spent = await LoyaltyLedger.aggregate([
    {
      $match: {
        user: userObjectId,
        type: 'CASHBACK_SPEND'
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' }
      }
    }
  ]);

  const earnedTotal = earned.length > 0 ? earned[0].total : 0;
  const spentTotal = spent.length > 0 ? spent[0].total : 0;

  return Math.max(0, earnedTotal - spentTotal);
}

async function getExpiringCashback(userId, daysThreshold = 30) {
  const now = new Date();
  const thresholdDate = new Date(now.getTime() + daysThreshold * 24 * 60 * 60 * 1000);
  const userObjectId = new mongoose.Types.ObjectId(userId);
  
  const expiring = await LoyaltyLedger.aggregate([
    {
      $match: {
        user: userObjectId,
        type: 'CASHBACK_EARN',
        expiresAt: {
          $exists: true,
          $gt: now,
          $lte: thresholdDate
        }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' },
        earliestExpiry: { $min: '$expiresAt' }
      }
    }
  ]);

  if (expiring.length === 0) {
    return { amount: 0, expiresAt: null };
  }

  return {
    amount: expiring[0].total,
    expiresAt: expiring[0].earliestExpiry
  };
}

async function calculateRank(xpTotal, config) {
  const sortedRanks = [...config.ranks].sort((a, b) => b.minXp - a.minXp);
  
  for (const rank of sortedRanks) {
    if (xpTotal >= rank.minXp) {
      return rank.name;
    }
  }
  
  return 'Bronze';
}

async function creditCashbackAndXp(userId, orderItemsTotal, orderId, stripeSessionId) {
  const config = await getOrCreateConfig();
  
  if (!config.enabled) {
    return { cashback: 0, xp: 0 };
  }

  const existingEarn = await LoyaltyLedger.findOne({
    order: orderId,
    type: { $in: ['CASHBACK_EARN', 'XP_EARN'] }
  });

  if (existingEarn) {
    console.log(`[Loyalty] Cashback/XP déjà crédité pour orderId ${orderId}`);
    return { cashback: 0, xp: 0, alreadyCredited: true };
  }

  const wallet = await getOrCreateWallet(userId);

  const effectiveCashbackRate = config.cashbackRatePercent + (wallet.rank ? getRankBonus(wallet.rank, config) : 0);
  let cashbackEarn = (orderItemsTotal * effectiveCashbackRate) / 100;
  cashbackEarn = Math.min(cashbackEarn, config.cashbackMaxEarnPerOrder);
  cashbackEarn = Math.round(cashbackEarn * 100) / 100;

  const xpEarn = Math.floor(orderItemsTotal * config.xpPerEuro);

  const expiresAt = new Date(Date.now() + config.cashbackExpiryDays * 24 * 60 * 60 * 1000);

  try {
    console.log(`[Loyalty] Tentative d'insertion cashback pour user ${userId}`);
    
    const cashbackEntry = await LoyaltyLedger.create({
      user: userId,
      type: 'CASHBACK_EARN',
      amount: cashbackEarn,
      expiresAt,
      order: orderId,
      stripeSessionId,
      description: `Cashback ${effectiveCashbackRate}% sur commande`
    });
    console.log(`[Loyalty] Cashback entry créée: ${cashbackEntry._id}`);

    const xpEntry = await LoyaltyLedger.create({
      user: userId,
      type: 'XP_EARN',
      xpAmount: xpEarn,
      order: orderId,
      stripeSessionId,
      description: `XP pour commande`
    });
    console.log(`[Loyalty] XP entry créée: ${xpEntry._id}`);

    wallet.xpTotal += xpEarn;
    const newRank = await calculateRank(wallet.xpTotal, config);
    wallet.rank = newRank;
    await wallet.save();
    console.log(`[Loyalty] Wallet sauvegardé: XP=${wallet.xpTotal}, Rank=${newRank}`);

    console.log(`[Loyalty] Crédité ${cashbackEarn}€ cashback + ${xpEarn} XP pour user ${userId}`);

    return { cashback: cashbackEarn, xp: xpEarn, newRank };
  } catch (insertError) {
    console.error(`[Loyalty] ERREUR lors de l'insertion dans MongoDB:`, insertError);
    console.error(`[Loyalty] Stack:`, insertError.stack);
    throw insertError;
  }
}

function getRankBonus(rankName, config) {
  const rank = config.ranks.find(r => r.name === rankName);
  return rank ? rank.cashbackBonus : 0;
}

async function calculateMaxCashbackUsage(userId, orderItemsTotal) {
  const config = await getOrCreateConfig();
  
  if (!config.enabled) {
    return 0;
  }

  const available = await calculateCashbackBalance(userId);
  
  const maxByPercent = (orderItemsTotal * config.cashbackMaxUsePercent) / 100;
  const maxByMinPayable = Math.max(0, orderItemsTotal - config.cashbackMinPayableAmount);
  
  const maxUsable = Math.min(available, maxByPercent, maxByMinPayable);
  
  return Math.max(0, Math.round(maxUsable * 100) / 100);
}

async function spendCashback(userId, amount, orderId, stripeSessionId) {
  if (amount <= 0) {
    return;
  }

  await LoyaltyLedger.create({
    user: userId,
    type: 'CASHBACK_SPEND',
    amount,
    order: orderId,
    stripeSessionId,
    description: `Utilisation cashback sur commande`
  });

  console.log(`[Loyalty] Dépensé ${amount}€ cashback pour user ${userId}`);
}

async function getLedgerHistory(userId, limit = 50) {
  return await LoyaltyLedger.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('order', 'invoiceNumber totalPrice')
    .lean();
}

module.exports = {
  getOrCreateConfig,
  getOrCreateWallet,
  calculateCashbackBalance,
  getExpiringCashback,
  calculateRank,
  creditCashbackAndXp,
  calculateMaxCashbackUsage,
  spendCashback,
  getLedgerHistory
};
