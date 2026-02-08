const express = require('express');
const router = express.Router();
const {
  setup2FA,
  verify2FA,
  validate2FA,
  disable2FA,
  regenerateBackupCodes,
  get2FAStatus
} = require('../controllers/twoFactorController');
const { protect } = require('../middleware/auth');

router.post('/setup', protect, setup2FA);
router.post('/verify', protect, verify2FA);
router.post('/disable', protect, disable2FA);
router.post('/regenerate-backup-codes', protect, regenerateBackupCodes);
router.get('/status', protect, get2FAStatus);

router.post('/validate', validate2FA);

module.exports = router;
