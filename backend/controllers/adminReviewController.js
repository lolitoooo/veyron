const Review = require('../models/Review');
const asyncHandler = require('express-async-handler');

// @desc    Get all reviews (pending, approved and rejected)
// @route   GET /api/admin/reviews
// @access  Private/Admin
exports.getAllReviews = asyncHandler(async (req, res) => {
  const { status } = req.query;
  
  let filter = {};
  if (status === 'pending') {
    filter.status = 'pending';
  } else if (status === 'approved') {
    filter.status = 'approved';
  } else if (status === 'rejected') {
    filter.status = 'rejected';
  }

  const reviews = await Review.find(filter)
    .populate('user', 'firstName lastName email')
    .populate('product', 'name')
    .populate('approvedBy', 'firstName lastName')
    .populate('rejectedBy', 'firstName lastName')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: reviews.length,
    data: reviews
  });
});

// @desc    Get pending reviews count
// @route   GET /api/admin/reviews/pending/count
// @access  Private/Admin
exports.getPendingReviewsCount = asyncHandler(async (req, res) => {
  const count = await Review.countDocuments({ status: 'pending' });

  res.status(200).json({
    success: true,
    data: { count }
  });
});

// @desc    Approve a review
// @route   PUT /api/admin/reviews/:id/approve
// @access  Private/Admin
exports.approveReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Avis non trouvé'
    });
  }

  review.status = 'approved';
  review.isApproved = true;
  review.approvedBy = req.user._id;
  review.approvedAt = Date.now();
  await review.save();

  const populatedReview = await Review.findById(review._id)
    .populate('user', 'firstName lastName email')
    .populate('product', 'name')
    .populate('approvedBy', 'firstName lastName');

  res.status(200).json({
    success: true,
    message: 'Avis approuvé avec succès',
    data: populatedReview
  });
});

// @desc    Reject a review (mark as rejected)
// @route   PUT /api/admin/reviews/:id/reject
// @access  Private/Admin
exports.rejectReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Avis non trouvé'
    });
  }

  review.status = 'rejected';
  review.isApproved = false;
  review.rejectedBy = req.user._id;
  review.rejectedAt = Date.now();
  await review.save();

  const populatedReview = await Review.findById(review._id)
    .populate('user', 'firstName lastName email')
    .populate('product', 'name')
    .populate('rejectedBy', 'firstName lastName');

  res.status(200).json({
    success: true,
    message: 'Avis rejeté avec succès',
    data: populatedReview
  });
});

// @desc    Bulk approve reviews
// @route   PUT /api/admin/reviews/bulk-approve
// @access  Private/Admin
exports.bulkApproveReviews = asyncHandler(async (req, res) => {
  const { reviewIds } = req.body;

  if (!reviewIds || !Array.isArray(reviewIds) || reviewIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Veuillez fournir un tableau d\'IDs d\'avis'
    });
  }

  const result = await Review.updateMany(
    { _id: { $in: reviewIds } },
    { 
      status: 'approved',
      isApproved: true,
      approvedBy: req.user._id,
      approvedAt: Date.now()
    }
  );

  res.status(200).json({
    success: true,
    message: `${result.modifiedCount} avis approuvés avec succès`,
    data: { modifiedCount: result.modifiedCount }
  });
});

// @desc    Bulk reject reviews
// @route   PUT /api/admin/reviews/bulk-reject
// @access  Private/Admin
exports.bulkRejectReviews = asyncHandler(async (req, res) => {
  const { reviewIds } = req.body;

  if (!reviewIds || !Array.isArray(reviewIds) || reviewIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Veuillez fournir un tableau d\'IDs d\'avis'
    });
  }

  const result = await Review.updateMany(
    { _id: { $in: reviewIds } },
    { 
      status: 'rejected',
      isApproved: false,
      rejectedBy: req.user._id,
      rejectedAt: Date.now()
    }
  );

  res.status(200).json({
    success: true,
    message: `${result.modifiedCount} avis rejetés avec succès`,
    data: { modifiedCount: result.modifiedCount }
  });
});
