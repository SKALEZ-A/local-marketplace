import { Router } from 'express';
import { OAuthController } from '../controllers/oauth.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { rateLimitMiddleware } from '../middleware/rateLimit.middleware';

const router = Router();
const oauthController = new OAuthController();

// OAuth provider routes
router.get('/google', rateLimitMiddleware, oauthController.googleAuth);
router.get('/google/callback', oauthController.googleCallback);
router.get('/facebook', rateLimitMiddleware, oauthController.facebookAuth);
router.get('/facebook/callback', oauthController.facebookCallback);
router.get('/github', rateLimitMiddleware, oauthController.githubAuth);
router.get('/github/callback', oauthController.githubCallback);
router.get('/apple', rateLimitMiddleware, oauthController.appleAuth);
router.get('/apple/callback', oauthController.appleCallback);

// OAuth token management
router.post('/refresh', rateLimitMiddleware, oauthController.refreshOAuthToken);
router.post('/revoke', authMiddleware, oauthController.revokeOAuthToken);
router.get('/providers', oauthController.getAvailableProviders);

export default router;
