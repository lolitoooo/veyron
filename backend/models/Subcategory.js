const mongoose = require('mongoose');

const SubcategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Veuillez ajouter un nom de sous-catégorie'],
    trim: true,
    maxlength: [100, 'Le nom ne peut pas dépasser 100 caractères']
  },
  slug: {
    type: String,
    unique: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Veuillez sélectionner une catégorie parente']
  },
  type: {
    type: String,
    enum: ['Haut', 'Bas', null],
    default: null
  },
  description: {
    type: String,
    maxlength: [500, 'La description ne peut pas dépasser 500 caractères']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

SubcategorySchema.pre('save', async function(next) {
  if (!this.isModified('name') && !this.isModified('category')) {
    next();
    return;
  }
  
  const baseSlug = this.name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  
  if (this.populated('category') || this.category) {
    const Category = mongoose.model('Category');
    const category = await Category.findById(this.category);
    
    if (category) {
      const categorySlug = category.slug.toLowerCase();
      if (categorySlug === 'femme') {
        this.slug = `${baseSlug}-femme`;
      } else if (categorySlug === 'homme') {
        this.slug = `${baseSlug}-homme`;
      } else {
        this.slug = baseSlug;
      }
    } else {
      this.slug = baseSlug;
    }
  } else {
    this.slug = baseSlug;
  }
  
  next();
});

SubcategorySchema.virtual('categorySlug').get(function() {
  const slugParts = this.slug.split('-');
  const lastPart = slugParts[slugParts.length - 1];
  
  if (lastPart === 'homme') return 'homme';
  if (lastPart === 'femme') return 'femme';
  
  return 'accessoires';
});

SubcategorySchema.set('toJSON', { virtuals: true });
SubcategorySchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Subcategory', SubcategorySchema);
