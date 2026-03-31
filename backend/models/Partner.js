const mongoose = require('mongoose');

const PartnerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Un compte utilisateur est requis'],
    unique: true
  },
  shopName: {
    type: String,
    required: [true, 'Veuillez ajouter un nom de boutique'],
    trim: true,
    maxlength: [100, 'Le nom ne peut pas dépasser 100 caractères']
  },
  slug: {
    type: String,
    unique: true
  },
  logo: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    maxlength: [2000, 'La description ne peut pas dépasser 2000 caractères'],
    default: ''
  },
  design: {
    primaryColor: { type: String, default: '#111111' },
    secondaryColor: { type: String, default: '#ece6d4' },
    backgroundColor: { type: String, default: '#ffffff' },
    bannerImage: { type: String, default: '' }
  },
  address: {
    street: { type: String, default: '' },
    city: { type: String, default: '' },
    postalCode: { type: String, default: '' },
    country: { type: String, default: 'France' }
  },
  phone: {
    type: String,
    default: ''
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
    default: ''
  },
  socialLinks: {
    instagram: { type: String, default: '' },
    facebook: { type: String, default: '' },
    website: { type: String, default: '' }
  },
  commission: {
    type: Number,
    required: true,
    default: 20,
    min: [0, 'La commission ne peut pas être négative'],
    max: [100, 'La commission ne peut pas dépasser 100%']
  },
  bankInfo: {
    iban: { type: String, default: '' },
    bic: { type: String, default: '' },
    bankName: { type: String, default: '' },
    accountHolder: { type: String, default: '' }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

PartnerSchema.virtual('products', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'partner',
  justOne: false
});

PartnerSchema.pre('save', function(next) {
  if (this.isModified('shopName')) {
    this.slug = this.shopName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

module.exports = mongoose.model('Partner', PartnerSchema);
