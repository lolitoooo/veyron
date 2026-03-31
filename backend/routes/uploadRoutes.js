const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { uploadSingleImage, uploadMultipleImages } = require('../controllers/uploadController');

router.post('/single', protect, authorize('admin', 'partner'), uploadSingleImage);
router.post('/multiple', protect, authorize('admin', 'partner'), uploadMultipleImages);

module.exports = router;
