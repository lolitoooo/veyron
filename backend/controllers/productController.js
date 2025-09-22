const Product = require('../models/Product');
const Category = require('../models/Category');

exports.searchProducts = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ success: false, message: 'Veuillez fournir un terme de recherche' });
    }
    
    const products = await Product.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { 'variants.name': { $regex: q, $options: 'i' } }
      ]
    }).populate('category', 'name');
    
    res.json({ success: true, products });
  } catch (err) {
    console.error('Erreur lors de la recherche de produits:', err);
    res.status(500).json({ success: false, message: 'Erreur lors de la recherche de produits' });
  }
};

exports.getProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    const queryObj = { ...req.query };
    const excludedFields = ['page', 'limit', 'sort', 'fields', 'q'];
    excludedFields.forEach(field => delete queryObj[field]);
    
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);
    
    let query = Product.find(JSON.parse(queryStr));
    if (req.query.q) {
      query = query.find({
        $or: [
          { name: { $regex: req.query.q, $options: 'i' } },
          { description: { $regex: req.query.q, $options: 'i' } }
        ]
      });
    }
    
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }
    
    if (req.query.fields) {
      const fields = req.query.fields.split(',').join(' ');
      query = query.select(fields);
    } else {
      query = query.select('-__v');
    }
    
    const products = await query.skip(startIndex).limit(limit);
    
    const total = await Product.countDocuments(JSON.parse(queryStr));
    
    res.status(200).json({
      success: true,
      count: products.length,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      },
      data: products
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('category');
    
    if (!product) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }
    
    res.status(200).json({
      success: true,
      data: product
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      salePrice,
      category,
      stock,
      images,
      features,
      specifications,
      isActive,
      sizes,
      colors,
      variants
    } = req.body;
    
    if (category) {
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        return res.status(400).json({ message: 'Catégorie non trouvée' });
      }
    }
    
    if (sizes && !Array.isArray(sizes)) {
      return res.status(400).json({ message: 'Les tailles doivent être un tableau' });
    }
    
    if (colors && !Array.isArray(colors)) {
      return res.status(400).json({ message: 'Les couleurs doivent être un tableau' });
    }
    
    if (variants && !Array.isArray(variants)) {
      return res.status(400).json({ message: 'Les variantes doivent être un tableau' });
    }
    
    let totalStock = 0;
    if (variants && variants.length > 0) {
      totalStock = variants.reduce((sum, variant) => sum + (variant.stock || 0), 0);
    } else {
      totalStock = stock || 0;
    }
    
    const { discount, discountPrice } = req.body;
    
    const product = await Product.create({
      name,
      description,
      price,
      discount,
      discountPrice,
      salePrice,
      category,
      stock: totalStock,
      images,
      features,
      specifications,
      isActive,
      sizes,
      colors,
      variants
    });
    
    res.status(201).json({
      success: true,
      data: product
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      salePrice,
      category,
      stock,
      images,
      features,
      specifications,
      isActive,
      sizes,
      colors,
      variants
    } = req.body;
    
    let product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }
    
    if (category) {
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        return res.status(400).json({ message: 'Catégorie non trouvée' });
      }
    }
    
    if (sizes && !Array.isArray(sizes)) {
      return res.status(400).json({ message: 'Les tailles doivent être un tableau' });
    }
    
    if (colors && !Array.isArray(colors)) {
      return res.status(400).json({ message: 'Les couleurs doivent être un tableau' });
    }
    
    if (variants && !Array.isArray(variants)) {
      return res.status(400).json({ message: 'Les variantes doivent être un tableau' });
    }
    
    let totalStock = stock;
    if (variants && variants.length > 0) {
      totalStock = variants.reduce((sum, variant) => sum + (variant.stock || 0), 0);
    }
    
    const updateData = { ...req.body };
    if (variants && variants.length > 0) {
      updateData.stock = totalStock;
    }
    
    product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      data: product
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }
    
    await product.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Produit supprimé avec succès'
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createProductReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }
    
    const alreadyReviewed = product.reviews.find(
      review => review.user.toString() === req.user.id
    );
    
    if (alreadyReviewed) {
      return res.status(400).json({ message: 'Vous avez déjà laissé un avis sur ce produit' });
    }
    
    const review = {
      name: `${req.user.firstName} ${req.user.lastName}`,
      rating: Number(rating),
      comment,
      user: req.user.id
    };
    
    product.reviews.push(review);
    
    product.numReviews = product.reviews.length;
    product.rating = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length;
    
    await product.save();
    
    res.status(201).json({
      success: true,
      message: 'Avis ajouté avec succès'
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getProductsByCategory = async (req, res) => {
  try {
    const products = await Product.find({ category: req.params.categoryId });
    
    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getSaleProducts = async (req, res) => {
  try {
    const products = await Product.find({ 
      salePrice: { $exists: true, $ne: null, $gt: 0 },
      isActive: true
    });
    
    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateProductStock = async (req, res) => {
  try {
    const { stock } = req.body;
    
    if (stock === undefined) {
      return res.status(400).json({ message: 'Veuillez fournir une valeur de stock' });
    }
    
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }
    
    product.stock = stock;
    await product.save();
    
    res.status(200).json({
      success: true,
      data: product
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};