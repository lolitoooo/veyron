const Review = require('../models/Review');
const Product = require('../models/Product');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');

// @desc    Get reviews for a product
// @route   GET /api/reviews/product/:productId
// @access  Public
exports.getProductReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ 
    product: req.params.productId,
    isApproved: true
  })
    .populate('user', 'firstName lastName')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: reviews.length,
    data: reviews
  });
});

// @desc    Get average rating for a product
// @route   GET /api/reviews/product/:productId/average
// @access  Public
exports.getProductAverageRating = asyncHandler(async (req, res) => {
  const result = await Review.aggregate([
    {
      $match: { 
        product: new mongoose.Types.ObjectId(req.params.productId),
        isApproved: true
      }
    },
    {
      $group: {
        _id: '$product',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: result.length > 0 ? result[0] : { averageRating: 0, totalReviews: 0 }
  });
});

// @desc    Create a review
// @route   POST /api/reviews
// @access  Private
exports.createReview = asyncHandler(async (req, res) => {
  const { product, rating, comment } = req.body;

  const productExists = await Product.findById(product);
  if (!productExists) {
    return res.status(404).json({
      success: false,
      message: 'Produit non trouvé'
    });
  }

  if (productExists.maxReviewsPerProduct) {
    const approvedReviewsCount = await Review.countDocuments({
      product,
      status: 'approved'
    });

    if (approvedReviewsCount >= productExists.maxReviewsPerProduct) {
      return res.status(400).json({
        success: false,
        message: `Ce produit a atteint la limite de ${productExists.maxReviewsPerProduct} avis`
      });
    }
  }

  const existingReview = await Review.findOne({
    product,
    user: req.user._id
  });

  if (existingReview) {
    return res.status(400).json({
      success: false,
      message: 'Vous avez déjà laissé un avis pour ce produit'
    });
  }

  const review = await Review.create({
    product,
    user: req.user._id,
    rating,
    comment,
    status: 'pending'
  });

  const populatedReview = await Review.findById(review._id)
    .populate('user', 'firstName lastName');

  res.status(201).json({
    success: true,
    message: 'Votre avis a été soumis et est en attente de validation',
    data: populatedReview
  });
});

// @desc    Update a review
// @route   PUT /api/reviews/:id
// @access  Private
exports.updateReview = asyncHandler(async (req, res) => {
  let review = await Review.findById(req.params.id);

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Avis non trouvé'
    });
  }

  if (review.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Non autorisé à modifier cet avis'
    });
  }

  // Empêcher la modification des avis approuvés
  if (review.status === 'approved') {
    return res.status(403).json({
      success: false,
      message: 'Vous ne pouvez pas modifier un avis approuvé. Vous pouvez uniquement le supprimer.'
    });
  }

  const { rating, comment } = req.body;

  review = await Review.findByIdAndUpdate(
    req.params.id,
    { rating, comment, updatedAt: Date.now(), status: 'pending', isApproved: false },
    { new: true, runValidators: true }
  ).populate('user', 'firstName lastName');

  res.status(200).json({
    success: true,
    data: review
  });
});

// @desc    Delete a review
// @route   DELETE /api/reviews/:id
// @access  Private
exports.deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Avis non trouvé'
    });
  }

  if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Non autorisé à supprimer cet avis'
    });
  }

  await review.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Avis supprimé avec succès'
  });
});

// @desc    Get user's review for a product
// @route   GET /api/reviews/product/:productId/user
// @access  Private
exports.getUserReviewForProduct = asyncHandler(async (req, res) => {
  const review = await Review.findOne({
    product: req.params.productId,
    user: req.user._id
  }).populate('user', 'firstName lastName');

  res.status(200).json({
    success: true,
    data: review
  });
});
