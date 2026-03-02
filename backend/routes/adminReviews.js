const express = require('express');
const router = express.Router();
const {
  getAllReviews,
  getPendingReviewsCount,
  approveReview,
  rejectReview,
  bulkApproveReviews,
  bulkRejectReviews
} = require('../controllers/adminReviewController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('admin'));
router.get('/', getAllReviews);
router.get('/pending/count', getPendingReviewsCount);
router.put('/:id/approve', approveReview);
router.put('/:id/reject', rejectReview);
router.put('/bulk-approve', bulkApproveReviews);
router.put('/bulk-reject', bulkRejectReviews);

module.exports = router;
