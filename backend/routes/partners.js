const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getPartners,
  getPartnerBySlug,
  getPartnerProducts,
  getMyPartner,
  updateMyPartner,
  getMyDashboard,
  getMyOrders,
  getMyOrderDetail,
  getMyStats,
  getMyProducts,
  updateMyProductStock,
  getMyPayouts,
  adminGetPartners,
  adminGetPartner,
  adminCreatePartner,
  adminUpdatePartner,
  adminDeletePartner,
  adminGetPartnerStats,
  adminGetPartnerProducts,
  adminCreatePartnerProduct,
  adminUpdatePartnerProduct,
  adminDeletePartnerProduct,
  adminGeneratePayout,
  adminMarkPayoutPaid,
  adminGetPayouts,
  adminResetPartnerPassword
} = require('../controllers/partnerController');

router.get('/me/profile', protect, authorize('partner'), getMyPartner);
router.put('/me/profile', protect, authorize('partner'), updateMyPartner);
router.get('/me/dashboard', protect, authorize('partner'), getMyDashboard);
router.get('/me/orders', protect, authorize('partner'), getMyOrders);
router.get('/me/orders/:id', protect, authorize('partner'), getMyOrderDetail);
router.get('/me/stats', protect, authorize('partner'), getMyStats);
router.get('/me/products', protect, authorize('partner'), getMyProducts);
router.put('/me/products/:productId/stock', protect, authorize('partner'), updateMyProductStock);
router.get('/me/payouts', protect, authorize('partner'), getMyPayouts);

router.get('/admin/all', protect, authorize('admin'), adminGetPartners);
router.post('/admin', protect, authorize('admin'), adminCreatePartner);
router.get('/admin/:id', protect, authorize('admin'), adminGetPartner);
router.put('/admin/:id', protect, authorize('admin'), adminUpdatePartner);
router.delete('/admin/:id', protect, authorize('admin'), adminDeletePartner);
router.post('/admin/:id/reset-password', protect, authorize('admin'), adminResetPartnerPassword);
router.get('/admin/:id/stats', protect, authorize('admin'), adminGetPartnerStats);
router.get('/admin/:id/products', protect, authorize('admin'), adminGetPartnerProducts);
router.post('/admin/:id/products', protect, authorize('admin'), adminCreatePartnerProduct);
router.put('/admin/:id/products/:productId', protect, authorize('admin'), adminUpdatePartnerProduct);
router.delete('/admin/:id/products/:productId', protect, authorize('admin'), adminDeletePartnerProduct);
router.get('/admin/:id/payouts', protect, authorize('admin'), adminGetPayouts);
router.post('/admin/:id/payouts', protect, authorize('admin'), adminGeneratePayout);
router.put('/admin/payouts/:payoutId/paid', protect, authorize('admin'), adminMarkPayoutPaid);

router.get('/', getPartners);
router.get('/:slug', getPartnerBySlug);
router.get('/:slug/products', getPartnerProducts);

module.exports = router;
