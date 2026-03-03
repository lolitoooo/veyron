const mongoose = require('mongoose');
const crypto = require('crypto');

const ReviewTokenSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  used: {
    type: Boolean,
    default: false
  },
  usedAt: {
    type: Date
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

ReviewTokenSchema.index({ token: 1 });
ReviewTokenSchema.index({ order: 1, product: 1 });
ReviewTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

ReviewTokenSchema.statics.generateToken = function() {
  return crypto.randomBytes(32).toString('hex');
};

ReviewTokenSchema.methods.isValid = function() {
  return !this.used && this.expiresAt > new Date();
};

module.exports = mongoose.model('ReviewToken', ReviewTokenSchema);
