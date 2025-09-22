const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const invoiceController = require('../controllers/invoiceController');
const { protect, authorize } = require('../middleware/auth');
const secureInvoices = require('../middleware/secureInvoices');
const {
  createOrder,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
  processPayment,
  getAllOrders,
  getAllOrdersWithoutPagination,
  generateInvoice,
  cancelOrder,
  cancelOrderBySession,
  getTotalRevenue
} = require('../controllers/orderController');

router.post('/', protect, createOrder);
router.get('/user/:userId', protect, getUserOrders);

// Routes spécifiques qui doivent être placées AVANT les routes avec paramètres d'ID
router.get('/stats/revenue', protect, authorize('admin'), getTotalRevenue);
router.get('/all', protect, authorize('admin'), getAllOrdersWithoutPagination);
router.get('/', protect, authorize('admin'), getAllOrders);
router.put('/cancel-by-session/:sessionId', cancelOrderBySession);

// Routes avec paramètres d'ID
router.get('/:id', protect, getOrderById);
router.get('/:id/invoice', protect, generateInvoice);
router.post('/:id/payment', protect, processPayment);
router.put('/:id/cancel', protect, cancelOrder);
router.post('/:id/invoice/generate', protect, invoiceController.generateInvoice);
router.get('/:id/invoice/download', protect, secureInvoices, invoiceController.downloadInvoice);
router.put('/:id/status', protect, authorize('admin'), updateOrderStatus);

module.exports = router;
