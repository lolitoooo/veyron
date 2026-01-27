const mongoose = require('mongoose');

const loyaltyLedgerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['CASHBACK_EARN', 'CASHBACK_SPEND', 'XP_EARN', 'ADJUSTMENT'],
    required: true
  },
  amount: {
    type: Number,
    default: 0
  },
  xpAmount: {
    type: Number,
    default: 0
  },
  expiresAt: {
    type: Date
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  stripeSessionId: {
    type: String
  },
  description: {
    type: String
  }
}, {
  timestamps: true
});

loyaltyLedgerSchema.index({ user: 1, createdAt: -1 });
loyaltyLedgerSchema.index({ user: 1, type: 1 });
loyaltyLedgerSchema.index({ expiresAt: 1 });

module.exports = mongoose.model('LoyaltyLedger', loyaltyLedgerSchema);
