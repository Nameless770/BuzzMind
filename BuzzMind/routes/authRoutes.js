const express = require('express');

const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/me', requireAuth, authController.getCurrentUser);
router.post('/logout', authController.logoutApi);
router.post('/signup/send-code', authController.sendSignupVerificationCode);
router.post('/forgot-password/send-code', authController.sendPasswordResetCode);
router.post('/forgot-password/verify-code', authController.verifyPasswordResetCode);

module.exports = router;
