const express = require('express');
const router = express.Router();
const { register, login, forgotPassword, resetPassword, activateAccount } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);
router.put('/activate/:token', activateAccount);

module.exports = router;