import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validationMiddleware } from '../middleware/validation.middleware';
import { rateLimitMiddleware } from '../middleware/rateLimit.middleware';

const router = Router();
const userController = new UserController();

// User profile routes
router.get('/profile', authMiddleware, userController.getProfile);
router.put('/profile', authMiddleware, validationMiddleware, userController.updateProfile);
router.delete('/profile', authMiddleware, userController.deleteProfile);
router.post('/profile/avatar', authMiddleware, userController.uploadAvatar);

// User preferences
router.get('/preferences', authMiddleware, userController.getPreferences);
router.put('/preferences', authMiddleware, userController.updatePreferences);

// User security
router.post('/change-password', authMiddleware, rateLimitMiddleware, userController.changePassword);
router.post('/enable-2fa', authMiddleware, userController.enable2FA);
router.post('/disable-2fa', authMiddleware, userController.disable2FA);
router.post('/verify-2fa', authMiddleware, userController.verify2FA);

// User sessions
router.get('/sessions', authMiddleware, userController.getSessions);
router.delete('/sessions/:sessionId', authMiddleware, userController.revokeSession);
router.delete('/sessions', authMiddleware, userController.revokeAllSessions);

export default router;
