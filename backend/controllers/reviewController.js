const Review = require('../models/Review');
const Product = require('../models/Product');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');

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

  const existingUnverifiedReview = await Review.findOne({
    product,
    user: req.user._id,
    isVerified: false
  });

  if (existingUnverifiedReview) {
    return res.status(400).json({
      success: false,
      message: 'Vous avez déjà laissé un avis non vérifié pour ce produit. Les avis vérifiés peuvent être ajoutés via les liens reçus par email après vos commandes.'
    });
  }

  const review = await Review.create({
    product,
    user: req.user._id,
    rating,
    comment,
    status: 'pending',
    isVerified: false,
    images: req.body.images || []
  });

  const populatedReview = await Review.findById(review._id)
    .populate('user', 'firstName lastName');

  res.status(201).json({
    success: true,
    message: 'Votre avis a été soumis et est en attente de validation',
    data: populatedReview
  });
});

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

  if (review.status === 'approved') {
    return res.status(403).json({
      success: false,
      message: 'Vous ne pouvez pas modifier un avis approuvé. Vous pouvez uniquement le supprimer.'
    });
  }

  const { rating, comment, images } = req.body;

  review = await Review.findByIdAndUpdate(
    req.params.id,
    { 
      rating, 
      comment, 
      images: images || [],
      updatedAt: Date.now(), 
      status: 'pending', 
      isApproved: false 
    },
    { new: true, runValidators: true }
  ).populate('user', 'firstName lastName');

  res.status(200).json({
    success: true,
    data: review
  });
});

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

exports.reportReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Avis non trouvé'
    });
  }

  if (review.reportedBy.includes(req.user._id)) {
    return res.status(400).json({
      success: false,
      message: 'Vous avez déjà signalé cet avis'
    });
  }

  review.reportedBy.push(req.user._id);
  review.reportCount = review.reportedBy.length;
  await review.save();

  res.json({
    success: true,
    message: 'Avis signalé avec succès',
    data: { reportCount: review.reportCount }
  });
});
