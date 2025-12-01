const mongoose = require('mongoose');

const shippingConfigSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    enum: ['home_delivery', 'relay_point']
  },
  displayName: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  freeShippingThreshold: {
    type: Number,
    required: true,
    min: 0,
    default: 70
  },
  enabled: {
    type: Boolean,
    default: true
  },
  estimatedDays: {
    min: {
      type: Number,
      default: 2
    },
    max: {
      type: Number,
      default: 5
    }
  },
  description: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

const ShippingConfig = mongoose.model('ShippingConfig', shippingConfigSchema);

module.exports = ShippingConfig;
