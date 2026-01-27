const loyaltyService = require('../services/loyaltyService');

exports.getBalance = async (req, res) => {
  try {
    const userId = req.user.id;

    const balance = await loyaltyService.calculateCashbackBalance(userId);
    const wallet = await loyaltyService.getOrCreateWallet(userId);
    const expiring = await loyaltyService.getExpiringCashback(userId, 30);
    const config = await loyaltyService.getOrCreateConfig();

    res.status(200).json({
      success: true,
      data: {
        cashbackBalance: balance,
        xpTotal: wallet.xpTotal,
        rank: wallet.rank,
        badges: wallet.badges,
        expiring: expiring,
        config: {
          enabled: config.enabled,
          cashbackRatePercent: config.cashbackRatePercent,
          ranks: config.ranks
        }
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du solde loyalty:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du solde'
    });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 50;

    const history = await loyaltyService.getLedgerHistory(userId, limit);

    res.status(200).json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique loyalty:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'historique'
    });
  }
};

exports.previewCashbackUsage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderItemsTotal } = req.body;

    if (!orderItemsTotal || orderItemsTotal <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Montant de commande invalide'
      });
    }

    const maxUsable = await loyaltyService.calculateMaxCashbackUsage(userId, orderItemsTotal);

    res.status(200).json({
      success: true,
      data: {
        maxCashbackUsable: maxUsable
      }
    });
  } catch (error) {
    console.error('Erreur lors du calcul du cashback utilisable:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du calcul'
    });
  }
};

exports.getConfig = async (req, res) => {
  try {
    const config = await loyaltyService.getOrCreateConfig();

    res.status(200).json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de la config loyalty:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la configuration'
    });
  }
};

exports.updateConfig = async (req, res) => {
  try {
    const LoyaltyConfig = require('../models/LoyaltyConfig');
    
    let config = await LoyaltyConfig.findOne();
    if (!config) {
      config = await LoyaltyConfig.create(req.body);
    } else {
      Object.assign(config, req.body);
      await config.save();
    }

    res.status(200).json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la config loyalty:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la configuration'
    });
  }
};
