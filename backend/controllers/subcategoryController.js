const Subcategory = require('../models/Subcategory');
const Category = require('../models/Category');

exports.getSubcategories = async (req, res) => {
  try {
    const subcategories = await Subcategory.find({ isActive: true })
      .populate('category', 'name slug')
      .sort('order name');
    
    res.status(200).json({
      success: true,
      count: subcategories.length,
      data: subcategories
    });
  } catch (err) {
    console.error('Erreur lors de la récupération des sous-catégories:', err);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des sous-catégories' });
  }
};

exports.getSubcategoriesByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Catégorie non trouvée' });
    }
    
    const subcategories = await Subcategory.find({ 
      category: categoryId,
      isActive: true 
    }).sort('order name');
    
    res.status(200).json({
      success: true,
      count: subcategories.length,
      data: subcategories
    });
  } catch (err) {
    console.error('Erreur lors de la récupération des sous-catégories:', err);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des sous-catégories' });
  }
};

exports.getSubcategoryById = async (req, res) => {
  try {
    const subcategory = await Subcategory.findById(req.params.id).populate('category', 'name slug');
    
    if (!subcategory) {
      return res.status(404).json({ success: false, message: 'Sous-catégorie non trouvée' });
    }
    
    res.status(200).json({
      success: true,
      data: subcategory
    });
  } catch (err) {
    console.error('Erreur lors de la récupération de la sous-catégorie:', err);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération de la sous-catégorie' });
  }
};

exports.createSubcategory = async (req, res) => {
  try {
    const { name, category, description, order } = req.body;
    
    if (!name || !category) {
      return res.status(400).json({ 
        success: false, 
        message: 'Veuillez fournir un nom et une catégorie' 
      });
    }
    
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(404).json({ success: false, message: 'Catégorie non trouvée' });
    }
    
    const subcategory = await Subcategory.create({
      name,
      category,
      description,
      order: order || 0
    });
    
    res.status(201).json({
      success: true,
      data: subcategory
    });
  } catch (err) {
    console.error('Erreur lors de la création de la sous-catégorie:', err);
    
    if (err.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: 'Une sous-catégorie avec ce nom existe déjà' 
      });
    }
    
    res.status(500).json({ success: false, message: 'Erreur lors de la création de la sous-catégorie' });
  }
};

exports.updateSubcategory = async (req, res) => {
  try {
    const { name, category, description, order, isActive } = req.body;
    
    const subcategory = await Subcategory.findById(req.params.id);
    
    if (!subcategory) {
      return res.status(404).json({ success: false, message: 'Sous-catégorie non trouvée' });
    }
    
    if (category) {
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        return res.status(404).json({ success: false, message: 'Catégorie non trouvée' });
      }
      subcategory.category = category;
    }
    
    if (name) subcategory.name = name;
    if (description !== undefined) subcategory.description = description;
    if (order !== undefined) subcategory.order = order;
    if (isActive !== undefined) subcategory.isActive = isActive;
    
    await subcategory.save();
    
    res.status(200).json({
      success: true,
      data: subcategory
    });
  } catch (err) {
    console.error('Erreur lors de la mise à jour de la sous-catégorie:', err);
    
    if (err.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: 'Une sous-catégorie avec ce nom existe déjà' 
      });
    }
    
    res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour de la sous-catégorie' });
  }
};

exports.deleteSubcategory = async (req, res) => {
  try {
    const subcategory = await Subcategory.findById(req.params.id);
    
    if (!subcategory) {
      return res.status(404).json({ success: false, message: 'Sous-catégorie non trouvée' });
    }
    
    await subcategory.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Sous-catégorie supprimée avec succès'
    });
  } catch (err) {
    console.error('Erreur lors de la suppression de la sous-catégorie:', err);
    res.status(500).json({ success: false, message: 'Erreur lors de la suppression de la sous-catégorie' });
  }
};
