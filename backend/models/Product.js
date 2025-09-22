const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Veuillez ajouter un nom de produit'],
    trim: true,
    maxlength: [100, 'Le nom ne peut pas dépasser 100 caractères']
  },
  slug: {
    type: String,
    unique: true
  },
  description: {
    type: String,
    required: [true, 'Veuillez ajouter une description'],
    maxlength: [2000, 'La description ne peut pas dépasser 2000 caractères']
  },
  price: {
    type: Number,
    required: [true, 'Veuillez ajouter un prix'],
    min: [0, 'Le prix ne peut pas être négatif'],
    get: v => Math.round(v * 100) / 100,
    set: v => parseFloat(parseFloat(v).toFixed(2))
  },
  discount: {
    type: Number,
    min: [0, 'La remise ne peut pas être négative'],
    max: [100, 'La remise ne peut pas dépasser 100%'],
    default: 0,
    get: v => Math.round(v * 100) / 100,
    set: v => parseFloat(parseFloat(v).toFixed(2))
  },
  discountPrice: {
    type: Number,
    min: [0, 'Le prix remisé ne peut pas être négatif'],
    get: v => Math.round(v * 100) / 100,
    set: v => parseFloat(parseFloat(v).toFixed(2))
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Veuillez sélectionner une catégorie']
  },
  brand: {
    type: String,
    required: [true, 'Veuillez ajouter une marque'],
    default: 'VEYRON'
  },
  stock: {
    type: Number,
    required: [true, 'Veuillez indiquer le stock disponible'],
    min: [0, 'Le stock ne peut pas être négatif'],
    default: 0
  },
  images: [
    {
      url: {
        type: String,
        required: true
      },
      alt: {
        type: String
      },
      isMain: {
        type: Boolean,
        default: false
      }
    }
  ],
  attributes: [
    {
      name: {
        type: String,
        required: true
      },
      value: {
        type: String,
        required: true
      }
    }
  ],
  sizes: {
    type: [String],
    enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Unique'],
    default: ['Unique']
  },
  colors: [
    {
      name: {
        type: String,
        required: true
      },
      code: {
        type: String,
        required: true
      },
      images: [
        {
          url: {
            type: String,
            required: true
          },
          alt: {
            type: String
          },
          isMain: {
            type: Boolean,
            default: false
          }
        }
      ]
    }
  ],
  variants: [
    {
      size: {
        type: String,
        required: true,
        enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Unique']
      },
      color: {
        type: String,
        required: true
      },
      stock: {
        type: Number,
        default: 0
      },
      price: {
        type: Number
      },
      sku: {
        type: String
      }
    }
  ],
  rating: {
    type: Number,
    default: 0,
    min: [0, 'La note minimale est 0'],
    max: [5, 'La note maximale est 5']
  },
  numReviews: {
    type: Number,
    default: 0
  },
  featured: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

ProductSchema.pre('save', function(next) {
  if (!this.isModified('name')) {
    next();
    return;
  }
  
  this.slug = this.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  
  next();
});

module.exports = mongoose.model('Product', ProductSchema);