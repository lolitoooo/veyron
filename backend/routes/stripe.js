const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createCheckoutSession,
  createCheckoutSessionGuest,
  getCheckoutSession,
  getCheckoutSessionPublic,
  webhook,
  generateInvoice
} = require('../controllers/stripeController');

const { cancelOrderBySession } = require('../controllers/orderController');

router.post('/create-checkout-session', protect, createCheckoutSession);
router.post('/create-checkout-session-guest', createCheckoutSessionGuest);
router.get('/checkout-session/:sessionId', protect, getCheckoutSession);
router.get('/checkout-session-public/:sessionId', getCheckoutSessionPublic);
router.post('/generate-invoice/:orderId', protect, generateInvoice);

router.put('/cancel-by-session/:sessionId', cancelOrderBySession);

router.post('/webhook', webhook);

module.exports = router;
