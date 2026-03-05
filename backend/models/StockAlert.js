const mongoose = require('mongoose');

const StockAlertSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  notified: {
    type: Boolean,
    default: false,
  },
  notifiedAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

StockAlertSchema.index({ product: 1, email: 1, notified: 1 });

module.exports = mongoose.model('StockAlert', StockAlertSchema);

