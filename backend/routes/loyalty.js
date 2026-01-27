const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getBalance,
  getHistory,
  previewCashbackUsage,
  getConfig,
  updateConfig
} = require('../controllers/loyaltyController');

router.get('/balance', protect, getBalance);
router.get('/history', protect, getHistory);
router.post('/preview-cashback', protect, previewCashbackUsage);

router.get('/config', getConfig);
router.put('/config', protect, authorize('admin'), updateConfig);

module.exports = router;
