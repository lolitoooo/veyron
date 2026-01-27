const mongoose = require('mongoose');

const rankSchema = new mongoose.Schema({
  name: { type: String, required: true },
  minXp: { type: Number, required: true },
  cashbackBonus: { type: Number, default: 0 }
}, { _id: false });

const loyaltyConfigSchema = new mongoose.Schema({
  enabled: { type: Boolean, default: true },
  cashbackRatePercent: { type: Number, default: 1.0 },
  cashbackExpiryDays: { type: Number, default: 365 },
  cashbackMaxEarnPerOrder: { type: Number, default: 20 },
  cashbackMaxUsePercent: { type: Number, default: 30 },
  cashbackMinPayableAmount: { type: Number, default: 1 },
  xpPerEuro: { type: Number, default: 1 },
  ranks: {
    type: [rankSchema],
    default: [
      { name: 'Bronze', minXp: 0, cashbackBonus: 0 },
      { name: 'Argent', minXp: 500, cashbackBonus: 0.1 },
      { name: 'Or', minXp: 1500, cashbackBonus: 0.25 },
      { name: 'Platine', minXp: 3000, cashbackBonus: 0.5 }
    ]
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('LoyaltyConfig', loyaltyConfigSchema);
