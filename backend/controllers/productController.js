const Product = require('../models/Product');
const Category = require('../models/Category');
const StockAlert = require('../models/StockAlert');
const { sendEmail } = require('../services/emailService');

const buildProductSlug = (product) => {
  if (!product || !product._id) {
    return product?.slug || '';
  }

  const id = product._id.toString();

  if (product.slug) {
    if (product.slug.includes(id)) {
      return product.slug;
    }
    return `${product.slug}-${id}`;
  }

  let slug = '';
  if (product.name) {
    slug = product.name
      .toLowerCase()
      .replace(/[\s\W-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  } else {
    slug = 'produit';
  }

  return `${slug}-${id}`;
};

exports.searchProducts = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ success: false, message: 'Veuillez fournir un terme de recherche' });
    }
    
    const searchQuery = {
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { 'variants.name': { $regex: q, $options: 'i' } }
      ]
    };
    
    const isAdmin = req.user && req.user.role === 'admin';
    if (!isAdmin) {
      searchQuery.isActive = true;
    }
    
    const products = await Product.find(searchQuery).populate('category', 'name');
    
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
    const excludedFields = ['page', 'limit', 'sort', 'fields', 'q', 'showAll', 'subcategory'];
    excludedFields.forEach(field => delete queryObj[field]);
    
    if (req.query.subcategory) {
      queryObj.subcategory = req.query.subcategory;
    }
    
    if (req.query.showAll !== 'true') {
      queryObj.isActive = true;
    }
    
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
    
    const products = await query.skip(startIndex).limit(limit).populate('subcategory', 'name slug');
    
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
    const paramId = req.params.id;
    let product = null;

    if (/^[0-9a-fA-F]{24}$/.test(paramId)) {
      product = await Product.findById(paramId).populate('category');
    }

    if (!product) {
      const trailingId = paramId.match(/([0-9a-fA-F]{24})$/);
      if (trailingId) {
        product = await Product.findById(trailingId[1]).populate('category');
      }
    }

    if (!product) {
      product = await Product.findOne({ slug: paramId }).populate('category');
    }
    
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
    
    const wasOutOfStock = !product.stock || product.stock <= 0;

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

    if (wasOutOfStock && product.stock > 0) {
      try {
        const alerts = await StockAlert.find({
          product: product._id,
          notified: false,
        });

        let categorySlug = null;
        try {
          const categoryDoc = await Category.findById(product.category).select('slug');
          categorySlug = categoryDoc?.slug || null;
        } catch (catErr) {
          console.error('Erreur lors de la récupération du slug de catégorie (updateProduct):', catErr);
        }

        const productSlug = buildProductSlug(product);
        const baseUrl = 'https://veyron-paris.fr';
        const productPath = categorySlug
          ? `/category/${categorySlug}/${productSlug}`
          : `/product/${productSlug}`;
        const productUrl = `${baseUrl}${productPath}`;

        for (const alert of alerts) {
          try {
            await sendEmail({
              to: alert.email,
              subject: `Votre article est de retour en stock - ${product.name}`,
              html: `
                <div style="font-family: 'Montserrat', Arial, sans-serif; font-size: 14px; color: #1a1a1a; background-color: #fafaf8; padding: 24px;">
                  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 24px; border: 1px solid #e8e8e8;">
                    <h1 style="font-family: 'Cormorant Garamond', 'Georgia', serif; font-size: 22px; letter-spacing: 0.12em; text-transform: uppercase; text-align: center; margin: 0 0 16px;">
                      Retour en stock
                    </h1>
                    <p style="margin: 0 0 12px;">Bonjour,</p>
                    <p style="margin: 0 0 16px;">
                      Le produit suivant est à nouveau disponible sur <strong>Veyron Paris</strong> :
                    </p>
                    <p style="margin: 0 0 8px;"><strong>${product.name}</strong></p>
                    <p style="margin: 0 0 16px;">
                      Nous vous recommandons de finaliser votre commande rapidement, les quantités sont limitées.
                    </p>
                    <div style="text-align: center; margin-top: 24px;">
                      <a href="${productUrl}"
                         style="display: inline-block; padding: 10px 22px; border-radius: 999px; background: #1a1a1a; color: #ffffff; text-decoration: none; text-transform: uppercase; letter-spacing: 0.08em; font-size: 12px;">
                        Voir le produit
                      </a>
                    </div>
                  </div>
                </div>
              `,
            });

            alert.notified = true;
            alert.notifiedAt = new Date();
            await alert.save();
          } catch (emailErr) {
            console.error('Erreur lors de la notification de retour en stock (updateProduct):', emailErr);
          }
        }

        await StockAlert.deleteMany({ product: product._id });
      } catch (alertErr) {
        console.error('Erreur lors du traitement des alertes de stock (updateProduct):', alertErr);
      }
    }
    
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

    const wasOutOfStock = !product.stock || product.stock <= 0;

    product.stock = stock;
    await product.save();

    if (wasOutOfStock && product.stock > 0) {
      try {
        const alerts = await StockAlert.find({
          product: product._id,
          notified: false,
        });

        let categorySlug = null;
        try {
          const categoryDoc = await Category.findById(product.category).select('slug');
          categorySlug = categoryDoc?.slug || null;
        } catch (catErr) {
          console.error('Erreur lors de la récupération du slug de catégorie (updateProductStock):', catErr);
        }

        const productSlug = buildProductSlug(product);
        const baseUrl = 'https://veyron-paris.fr';
        const productPath = categorySlug
          ? `/category/${categorySlug}/${productSlug}`
          : `/product/${productSlug}`;
        const productUrl = `${baseUrl}${productPath}`;

        for (const alert of alerts) {
          try {
            await sendEmail({
              to: alert.email,
              subject: `Votre article est de retour en stock - ${product.name}`,
              html: `
                <div style="font-family: 'Montserrat', Arial, sans-serif; font-size: 14px; color: #1a1a1a; background-color: #fafaf8; padding: 24px;">
                  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 24px; border: 1px solid #e8e8e8;">
                    <h1 style="font-family: 'Cormorant Garamond', 'Georgia', serif; font-size: 22px; letter-spacing: 0.12em; text-transform: uppercase; text-align: center; margin: 0 0 16px;">
                      Retour en stock
                    </h1>
                    <p style="margin: 0 0 12px;">Bonjour,</p>
                    <p style="margin: 0 0 16px;">
                      Le produit suivant est à nouveau disponible sur <strong>Veyron Paris</strong> :
                    </p>
                    <p style="margin: 0 0 8px;"><strong>${product.name}</strong></p>
                    <p style="margin: 0 0 16px;">
                      Nous vous recommandons de finaliser votre commande rapidement, les quantités sont limitées.
                    </p>
                    <div style="text-align: center; margin-top: 24px;">
                      <a href="${productUrl}"
                         style="display: inline-block; padding: 10px 22px; border-radius: 999px; background: #1a1a1a; color: #ffffff; text-decoration: none; text-transform: uppercase; letter-spacing: 0.08em; font-size: 12px;">
                        Voir le produit
                      </a>
                    </div>
                  </div>
                </div>
              `,
            });

            alert.notified = true;
            alert.notifiedAt = new Date();
            await alert.save();
          } catch (emailErr) {
            console.error('Erreur lors de la notification de retour en stock:', emailErr);
          }
        }

        await StockAlert.deleteMany({ product: product._id });
      } catch (alertErr) {
        console.error('Erreur lors du traitement des alertes de stock:', alertErr);
      }
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.subscribeStockAlert = async (req, res) => {
  try {
    const { email } = req.body;
    const productId = req.params.id;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ success: false, message: 'Email requis' });
    }

    const emailTrimmed = email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTrimmed)) {
      return res.status(400).json({ success: false, message: 'Format d\'email invalide' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Produit non trouvé' });
    }

    const existing = await StockAlert.findOne({
      product: productId,
      email: emailTrimmed,
      notified: false,
    });

    if (existing) {
      return res.status(200).json({
        success: true,
        message: 'Votre email est déjà inscrit pour ce produit. Vous serez prévenu dès qu\'il sera de nouveau en stock.',
        alreadySubscribed: true,
      });
    }

    await StockAlert.create({
      product: productId,
      email: emailTrimmed,
    });

    res.status(201).json({
      success: true,
      message: 'Nous vous avertirons dès que ce produit sera de nouveau en stock.',
      alreadySubscribed: false,
    });
  } catch (err) {
    console.error('Erreur lors de l\'inscription à l\'alerte stock:', err);
    res.status(500).json({ success: false, message: 'Erreur lors de l\'inscription à l\'alerte stock' });
  }
};
