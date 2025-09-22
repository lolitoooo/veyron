const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { protect } = require('../middleware/auth');

router.get('/:userId', protect, cartController.getCart);
router.post('/', protect, cartController.updateCart);
router.delete('/:userId', protect, cartController.clearCart);
router.delete('/:userId/clear', protect, cartController.clearCart);

module.exports = router;
