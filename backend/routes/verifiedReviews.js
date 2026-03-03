const express = require('express');
const router = express.Router();
const {
  createVerifiedReview,
  checkToken
} = require('../controllers/verifiedReviewController');

router.post('/', createVerifiedReview);
router.get('/check/:token', checkToken);

module.exports = router;
