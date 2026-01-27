const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: false,
    ref: 'User'
  },
  guestEmail: {
    type: String,
    lowercase: true,
    trim: true,
    required: function () {
      return !this.user;
    }
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
  shippingMethod: {
    type: String,
    enum: ['home_delivery', 'relay_point'],
    default: 'home_delivery'
  },
  relayPoint: {
    id: { type: String },
    carrier: { type: String },
    name: { type: String },
    address: { type: String },
    postalCode: { type: String },
    city: { type: String }
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
  promoCode: {
    code: { type: String },
    title: { type: String },
    discountType: { 
      type: String,
      enum: ['percentage', 'fixed']
    },
    discountValue: { type: Number },
    discountAmount: { type: Number, default: 0 },
    promoCodeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PromoCode'
    }
  },
  subtotalHT: {
    type: Number,
    default: 0
  },
  subtotalTTC: {
    type: Number,
    default: 0
  },
  discountAmount: {
    type: Number,
    default: 0
  },
  discountPercentage: {
    type: Number,
    default: 0
  },
  cashbackUsed: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

OrderSchema.methods.calculateTotalPrice = function() {
  const itemsPriceHT = this.orderItems.reduce(
    (acc, item) => acc + item.priceHT * item.qty,
    0
  );
  this.subtotalHT = parseFloat(itemsPriceHT.toFixed(2));
  
  const itemsPriceTTC = this.orderItems.reduce(
    (acc, item) => acc + item.price * item.qty,
    0
  );
  this.subtotalTTC = parseFloat(itemsPriceTTC.toFixed(2));
  
  this.taxPrice = parseFloat((this.subtotalTTC - this.subtotalHT).toFixed(2));
  
  if (this.promoCode && this.promoCode.code) {
    if (this.promoCode.discountType === 'percentage') {
      this.discountPercentage = this.promoCode.discountValue;
      this.discountAmount = parseFloat((this.subtotalTTC * (this.discountPercentage / 100)).toFixed(2));
      
      if (this.promoCode.maxDiscountAmount && this.discountAmount > this.promoCode.maxDiscountAmount) {
        this.discountAmount = parseFloat(this.promoCode.maxDiscountAmount.toFixed(2));
      }
    } else if (this.promoCode.discountType === 'fixed') {
      this.discountAmount = parseFloat(this.promoCode.discountValue.toFixed(2));
      this.discountPercentage = parseFloat(((this.discountAmount / this.subtotalTTC) * 100).toFixed(2));
      
      if (this.discountAmount > this.subtotalTTC) {
        this.discountAmount = this.subtotalTTC;
        this.discountPercentage = 100;
      }
    }
    
    this.promoCode.discountAmount = this.discountAmount;
  } else {
    this.discountAmount = 0;
    this.discountPercentage = 0;
  }
  
  const discountedPrice = parseFloat((this.subtotalTTC - this.discountAmount).toFixed(2));
  
  this.totalPrice = parseFloat((discountedPrice + this.shippingPrice).toFixed(2));
  
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