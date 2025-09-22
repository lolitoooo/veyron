const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  orderItems: [
    {
      name: { type: String, required: true },
      qty: { type: Number, required: true },
      image: { type: String, required: true },
      price: { type: Number, required: true },
      priceHT: { type: Number, required: true },
      variant: {
        size: { type: String, required: true },
        color: { type: String, required: true },
        colorCode: { type: String }
      },
      variantId: { type: String, required: true },
      product: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Product'
      }
    }
  ],
  invoiceNumber: { type: String },
  invoiceDate: { type: Date },
  invoiceUrl: { type: String },
  invoicePath: { type: String },
  
  shippingAddress: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String },
    city: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
    phone: { type: String, required: true }
  },
  billingAddress: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String },
    city: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
    phone: { type: String, required: true }
  },
  paymentMethod: {
    type: String,
    required: true
  },
  paymentResult: {
    id: { type: String },
    status: { type: String },
    update_time: { type: String },
    email_address: { type: String },
    payment_intent: { type: String },
    client_secret: { type: String }
  },
  stripeSessionId: { type: String },
  
  taxPrice: {
    type: Number,
    required: true,
    default: 0.0
  },
  shippingPrice: {
    type: Number,
    required: true,
    default: 0.0
  },
  totalPrice: {
    type: Number,
    required: true,
    default: 0.0
  },
  isPaid: {
    type: Boolean,
    required: true,
    default: false
  },
  paidAt: {
    type: Date
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  deliveredAt: {
    type: Date
  },
  trackingNumber: {
    type: String
  },
  carrier: {
    type: String
  },
  notes: {
    type: String
  },
  refundStatus: {
    type: String,
    enum: ['none', 'requested', 'partial', 'full'],
    default: 'none'
  },
  refundAmount: {
    type: Number,
    default: 0
  },
  refundReason: {
    type: String
  },
  refundedAt: {
    type: Date
  },
  couponCode: {
    type: String
  },
  couponDiscount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

OrderSchema.methods.calculateTotalPrice = function() {
  const itemsPrice = this.orderItems.reduce(
    (acc, item) => acc + item.price * item.qty,
    0
  );
  
  const itemsPriceHT = this.orderItems.reduce(
    (acc, item) => acc + item.priceHT * item.qty,
    0
  );
  
  this.taxPrice = itemsPrice - itemsPriceHT;
  
  const discountedPrice = this.couponDiscount 
    ? itemsPrice - this.couponDiscount 
    : itemsPrice;
  
  this.totalPrice = discountedPrice + this.shippingPrice;
  
  return this.totalPrice;
};

OrderSchema.methods.canBeCancelled = function() {
  return true;
};

OrderSchema.methods.canBeRefunded = function() {
  return this.isPaid && this.refundStatus !== 'full';
};

OrderSchema.methods.getFormattedOrderNumber = function() {
  const idStr = this._id.toString();
  const lastPart = idStr.substring(idStr.length - 8);
  return `VEY-${lastPart.toUpperCase()}`;
};

OrderSchema.methods.generateInvoiceNumber = function() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const idStr = this._id.toString();
  const lastPart = idStr.substring(idStr.length - 6);
  this.invoiceNumber = `FACT-${year}${month}-${lastPart.toUpperCase()}`;
  this.invoiceDate = date;
  return this.invoiceNumber;
};

OrderSchema.pre('save', function(next) {
  if (this.isNew && !this.billingAddress.addressLine1 && this.shippingAddress.addressLine1) {
    this.billingAddress = this.shippingAddress;
  }
  next();
});

module.exports = mongoose.model('Order', OrderSchema);