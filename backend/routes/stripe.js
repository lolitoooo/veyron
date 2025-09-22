const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createCheckoutSession,
  getCheckoutSession,
  webhook,
  generateInvoice
} = require('../controllers/stripeController');

const { cancelOrderBySession } = require('../controllers/orderController');

const stripeWebhookMiddleware = express.raw({ type: 'application/json' });

router.post('/create-checkout-session', protect, createCheckoutSession);
router.get('/checkout-session/:sessionId', protect, getCheckoutSession);
router.post('/generate-invoice/:orderId', protect, generateInvoice);

router.put('/cancel-by-session/:sessionId', cancelOrderBySession);

router.post('/webhook', stripeWebhookMiddleware, webhook);

module.exports = router;
