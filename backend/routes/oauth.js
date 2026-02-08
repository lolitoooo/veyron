const express = require('express');
const router = express.Router();
const {
  googleAuth,
  googleCallback,
  getProviders
} = require('../controllers/oauthController');

router.get('/google', googleAuth);
router.get('/google/callback', googleCallback);

router.get('/providers', getProviders);

module.exports = router;
