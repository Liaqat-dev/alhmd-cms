const express = require('express');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const router = express.Router();
const authController = require('../controllers/authController');
const { uploadProfilePic, deleteProfilePic } = require('../controllers/profilePicController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  },
});

// ── Rate limiters ─────────────────────────────────────────────────────────────

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development'?100:5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Please try again in 15 minutes.' },
  skipSuccessfulRequests: true, // Only count failed attempts
});

const refreshLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many token refresh requests. Slow down.' },
});

const verificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many verification requests. Please try again later.' },
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many registration attempts.' },
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many password reset requests. Please try again later.' },
});

// ── Public routes ─────────────────────────────────────────────────────────────

router.post('/login', loginLimiter, authController.login);
router.post('/student-login', loginLimiter, authController.studentLogin);
router.post('/register-admin', registerLimiter, authController.registerAdmin);

// Email verification (token in query string, no auth required)
router.get('/verify-email', verificationLimiter, authController.verifyEmail);
router.post('/resend-verification', verificationLimiter, authController.resendVerification);

// Token refresh (uses httpOnly cookie, no Bearer token needed)
router.post('/refresh-token', refreshLimiter, authController.refreshToken);
router.post('/student-refresh-token', refreshLimiter, authController.studentRefreshToken);

// Logout (cookie-based, no Bearer needed — best-effort revocation)
router.post('/logout', authController.logout);
router.post('/student-logout', authController.studentLogout);

// Password reset (self-service, public)
router.post('/forgot-password', forgotPasswordLimiter, authController.forgotPassword);
router.post('/student-forgot-password', forgotPasswordLimiter, authController.studentForgotPassword);
router.post('/reset-password-token', authController.resetPasswordWithToken);

// ── Protected routes ──────────────────────────────────────────────────────────

router.get('/profile', auth, authController.getProfile);
router.post('/change-password', auth, authController.changePassword);
router.post('/logout-all', auth, authController.logoutAll);
router.post('/profile-pic', auth, upload.single('profilePic'), uploadProfilePic);
router.delete('/profile-pic', auth, deleteProfilePic);

// Admin only
router.post('/reset-password', auth, roleCheck('ADMIN'), authController.resetPassword);

module.exports = router;
