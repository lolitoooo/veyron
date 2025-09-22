const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  addToWishlist,
  removeFromWishlist,
  removeProductFromWishlist,
  getWishlist,
  checkWishlistItem
} = require('../controllers/wishlistController');

router.use(protect);

router.route('/')
  .get(getWishlist)
  .post(addToWishlist);

router.route('/:id')
  .delete(removeFromWishlist);

router.route('/product/:productId')
  .delete(removeProductFromWishlist);

router.route('/check/:productId')
  .get(checkWishlistItem);

module.exports = router;
