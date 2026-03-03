const Review = require('../models/Review');
const ReviewToken = require('../models/ReviewToken');
const Product = require('../models/Product');
const Order = require('../models/Order');

exports.createVerifiedReview = async (req, res) => {
  try {
    const { token, rating, comment } = req.body;

    if (!token || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Token, note et commentaire requis'
      });
    }

    const reviewToken = await ReviewToken.findOne({ token })
      .populate('product')
      .populate('order');

    if (!reviewToken) {
      return res.status(404).json({
        success: false,
        message: 'Token invalide'
      });
    }

    if (!reviewToken.isValid()) {
      return res.status(400).json({
        success: false,
        message: reviewToken.used 
          ? 'Ce lien a déjà été utilisé' 
          : 'Ce lien a expiré'
      });
    }

    const existingReview = await Review.findOne({
      verificationToken: token
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'Ce lien a déjà été utilisé pour créer un avis'
      });
    }

    const review = await Review.create({
      product: reviewToken.product._id,
      user: reviewToken.user,
      rating,
      comment,
      isVerified: true,
      verificationToken: token,
      order: reviewToken.order._id,
      status: 'pending',
      images: req.body.images || []
    });

    reviewToken.used = true;
    reviewToken.usedAt = new Date();
    await reviewToken.save();

    await review.populate('product user');

    res.status(201).json({
      success: true,
      data: review,
      message: 'Avis vérifié créé avec succès. Il sera visible après validation par un administrateur.'
    });
  } catch (error) {
    console.error('Erreur création avis vérifié:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'avis vérifié'
    });
  }
};

exports.checkToken = async (req, res) => {
  try {
    const { token } = req.params;

    const reviewToken = await ReviewToken.findOne({ token })
      .populate('product', 'name images')
      .populate('order', 'orderNumber');

    if (!reviewToken) {
      return res.status(404).json({
        success: false,
        message: 'Token invalide'
      });
    }

    const isValid = reviewToken.isValid();

    res.json({
      success: true,
      data: {
        valid: isValid,
        used: reviewToken.used,
        expired: reviewToken.expiresAt < new Date(),
        product: reviewToken.product,
        order: reviewToken.order,
        expiresAt: reviewToken.expiresAt
      }
    });
  } catch (error) {
    console.error('Erreur vérification token:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification du token'
    });
  }
};
