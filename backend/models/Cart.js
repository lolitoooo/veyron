const mongoose = require('mongoose');

const CartItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  image: {
    type: String,
    required: true
  },
  variant: {
    size: {
      type: String,
      required: true
    },
    color: {
      type: String,
      required: true
    },
    colorCode: {
      type: String
    }
  },
  variantId: {
    type: String,
    required: true
  }
});

const CartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [CartItemSchema],
  total: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

CartSchema.methods.calculateTotal = function() {
  this.total = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  return this.total;
};

module.exports = mongoose.model('Cart', CartSchema);
