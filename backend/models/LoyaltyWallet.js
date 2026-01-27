const mongoose = require('mongoose');

const loyaltyWalletSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  xpTotal: {
    type: Number,
    default: 0
  },
  rank: {
    type: String,
    default: 'Bronze'
  },
  badges: [{
    type: String
  }]
}, {
  timestamps: true
});

loyaltyWalletSchema.index({ user: 1 });

module.exports = mongoose.model('LoyaltyWallet', loyaltyWalletSchema);
