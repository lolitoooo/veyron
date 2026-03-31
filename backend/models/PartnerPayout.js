const mongoose = require('mongoose');

const PartnerPayoutSchema = new mongoose.Schema({
  partner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Partner',
    required: [true, 'Le partenaire est requis']
  },
  period: {
    type: String,
    required: [true, 'La période est requise']
  },
  grossAmount: {
    type: Number,
    required: true,
    default: 0
  },
  commissionRate: {
    type: Number,
    required: true
  },
  commissionAmount: {
    type: Number,
    required: true,
    default: 0
  },
  netAmount: {
    type: Number,
    required: true,
    default: 0
  },
  ordersCount: {
    type: Number,
    default: 0
  },
  orderIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  }],
  status: {
    type: String,
    enum: ['pending', 'paid'],
    default: 'pending'
  },
  paidAt: {
    type: Date
  },
  reference: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

PartnerPayoutSchema.index({ partner: 1, period: 1 }, { unique: true });

module.exports = mongoose.model('PartnerPayout', PartnerPayoutSchema);
