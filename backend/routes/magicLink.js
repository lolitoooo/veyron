const express = require('express');
const router = express.Router();
const {
  sendMagicLink,
  verifyMagicLink
} = require('../controllers/magicLinkController');

router.post('/send', sendMagicLink);
router.post('/verify', verifyMagicLink);

module.exports = router;
