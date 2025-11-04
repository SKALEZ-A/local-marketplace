import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { OAuthController } from '../controllers/oauth.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { rateLimitMiddleware } from '../middleware/rateLimit.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  verifyEmailSchema,
  enable2FASchema,
  verify2FASchema
} from '../validators/auth.validator';

const router = Router();
const authController = new AuthController();
const oauthController = new OAuthController();

// Public routes with rate limiting
router.post(
  '/register',
  rateLimitMiddleware({ windowMs: 15 * 60 * 1000, max: 5 }),
  validateRequest(registerSchema),
  authController.register
);

router.post(
  '/login',
  rateLimitMiddleware({ windowMs: 15 * 60 * 1000, max: 10 }),
  validateRequest(loginSchema),
  authController.login
);

router.post(
  '/forgot-password',
  rateLimitMiddleware({ windowMs: 15 * 60 * 1000, max: 3 }),
  validateRequest(forgotPasswordSchema),
  authController.forgotPassword
);

router.post(
  '/reset-password',
  rateLimitMiddleware({ windowMs: 15 * 60 * 1000, max: 5 }),
  validateRequest(resetPasswordSchema),
  authController.resetPassword
);

router.post(
  '/verify-email',
  validateRequest(verifyEmailSchema),
  authController.verifyEmail
);

router.post(
  '/resend-verification',
  rateLimitMiddleware({ windowMs: 15 * 60 * 1000, max: 3 }),
  authController.resendVerification
);

router.post(
  '/refresh-token',
  rateLimitMiddleware({ windowMs: 15 * 60 * 1000, max: 20 }),
  authController.refreshToken
);

// OAuth routes
router.get('/oauth/google', oauthController.googleAuth);
router.get('/oauth/google/callback', oauthController.googleCallback);
router.get('/oauth/facebook', oauthController.facebookAuth);
router.get('/oauth/facebook/callback', oauthController.facebookCallback);

// Protected routes
router.use(authMiddleware);

router.post('/logout', authController.logout);
router.post('/logout-all', authController.logoutAll);

router.get('/me', authController.getCurrentUser);
router.patch('/me', authController.updateProfile);
router.delete('/me', authController.deleteAccount);

router.post(
  '/change-password',
  validateRequest(changePasswordSchema),
  authController.changePassword
);

// Two-factor authentication
router.post(
  '/2fa/enable',
  validateRequest(enable2FASchema),
  authController.enable2FA
);

router.post(
  '/2fa/verify',
  validateRequest(verify2FASchema),
  authController.verify2FA
);

router.post('/2fa/disable', authController.disable2FA);

// Session management
router.get('/sessions', authController.getSessions);
router.delete('/sessions/:sessionId', authController.revokeSession);

// Admin routes
router.get('/users', authMiddleware, authController.getAllUsers);
router.get('/users/:userId', authMiddleware, authController.getUserById);
router.patch('/users/:userId/status', authMiddleware, authController.updateUserStatus);
router.delete('/users/:userId', authMiddleware, authController.deleteUser);

export default router;
