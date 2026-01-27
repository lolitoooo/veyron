const express = require('express');
const router = express.Router();
const { sendContactMessage } = require('../controllers/contactController');
const { contactLimiter } = require('../middleware/rateLimiter');

router.post('/', contactLimiter, sendContactMessage);

module.exports = router;
