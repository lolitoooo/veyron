const express = require('express');
const router = express.Router();
const {
  getProductReviews,
  getProductAverageRating,
  createReview,
  updateReview,
  deleteReview,
  getUserReviewForProduct,
  reportReview
} = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');

router.get('/product/:productId', getProductReviews);
router.get('/product/:productId/average', getProductAverageRating);
router.post('/', protect, createReview);
router.put('/:id', protect, updateReview);
router.delete('/:id', protect, deleteReview);
router.get('/product/:productId/user', protect, getUserReviewForProduct);
router.post('/:id/report', protect, reportReview);

module.exports = router;
