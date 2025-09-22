const Category = require('../models/Category');
const Product = require('../models/Product');
const asyncHandler = require('express-async-handler');

exports.getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort({ name: 1 });
  res.json(categories);
});

exports.getCategoriesWithProductCount = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort({ name: 1 });
  
  const categoriesWithCount = await Promise.all(categories.map(async (category) => {
    const productCount = await Product.countDocuments({ category: category._id });
    
    const categoryObj = category.toObject();
    
    return {
      ...categoryObj,
      productCount
    };
  }));
  
  res.json(categoriesWithCount);
});

exports.getCategoryById = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  
  if (!category) {
    res.status(404);
    throw new Error('Catégorie non trouvée');
  }
  
  res.json(category);
});

exports.createCategory = asyncHandler(async (req, res) => {
  const { name, description, image, parent, featured, active, slug } = req.body;
  
  const categoryExists = await Category.findOne({ name });
  
  if (categoryExists) {
    res.status(400);
    throw new Error('Une catégorie avec ce nom existe déjà');
  }
  
  const slugValue = slug || name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
    
  const category = await Category.create({
    name,
    slug: slugValue,
    description,
    image,
    parent: parent || null,
    featured: featured || false,
    active: active !== undefined ? active : true
  });
  
  if (category) {
    res.status(201).json(category);
  } else {
    res.status(400);
    throw new Error('Données de catégorie invalides');
  }
});

exports.updateCategory = asyncHandler(async (req, res) => {
  const { name, description, image, parent, featured, active } = req.body;
  
  const category = await Category.findById(req.params.id);
  
  if (!category) {
    res.status(404);
    throw new Error('Catégorie non trouvée');
  }
  
  if (name && name !== category.name) {
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      res.status(400);
      throw new Error('Une catégorie avec ce nom existe déjà');
    }
  }
  
  category.name = name || category.name;
  category.description = description !== undefined ? description : category.description;
  category.image = image || category.image;
  category.parent = parent !== undefined ? parent : category.parent;
  category.featured = featured !== undefined ? featured : category.featured;
  category.active = active !== undefined ? active : category.active;
  
  const updatedCategory = await category.save();
  res.json(updatedCategory);
});

exports.deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  
  if (!category) {
    res.status(404);
    throw new Error('Catégorie non trouvée');
  }
  
  const hasSubcategories = await Category.exists({ parent: category._id });
  
  if (hasSubcategories) {
    res.status(400);
    throw new Error('Cette catégorie a des sous-catégories. Veuillez les supprimer d\'abord.');
  }
  
  await category.deleteOne();
  res.json({ message: 'Catégorie supprimée' });
});

exports.getMainCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ parent: null }).sort({ name: 1 });
  res.json(categories);
});

exports.getSubcategories = asyncHandler(async (req, res) => {
  const subcategories = await Category.find({ parent: req.params.id }).sort({ name: 1 });
  res.json(subcategories);
});


exports.getFeaturedCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ featured: true, active: true }).sort({ name: 1 });
  res.json(categories);
});
