import { Router } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { authMiddleware } from '../middleware/auth.middleware';
import { rateLimitMiddleware } from '../middleware/rateLimit.middleware';

const router = Router();

// Auth service routes
router.use('/auth', rateLimitMiddleware, createProxyMiddleware({
  target: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  changeOrigin: true,
  pathRewrite: { '^/auth': '' }
}));

// Product service routes
router.use('/products', createProxyMiddleware({
  target: process.env.PRODUCT_SERVICE_URL || 'http://localhost:3003',
  changeOrigin: true,
  pathRewrite: { '^/products': '' }
}));

// Order service routes
router.use('/orders', authMiddleware, createProxyMiddleware({
  target: process.env.ORDER_SERVICE_URL || 'http://localhost:3004',
  changeOrigin: true,
  pathRewrite: { '^/orders': '' }
}));

// Payment service routes
router.use('/payments', authMiddleware, createProxyMiddleware({
  target: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3005',
  changeOrigin: true,
  pathRewrite: { '^/payments': '' }
}));

// Delivery service routes
router.use('/deliveries', authMiddleware, createProxyMiddleware({
  target: process.env.DELIVERY_SERVICE_URL || 'http://localhost:3006',
  changeOrigin: true,
  pathRewrite: { '^/deliveries': '' }
}));

// Review service routes
router.use('/reviews', createProxyMiddleware({
  target: process.env.REVIEW_SERVICE_URL || 'http://localhost:3007',
  changeOrigin: true,
  pathRewrite: { '^/reviews': '' }
}));

// Chat service routes
router.use('/chats', authMiddleware, createProxyMiddleware({
  target: process.env.CHAT_SERVICE_URL || 'http://localhost:3008',
  changeOrigin: true,
  pathRewrite: { '^/chats': '' }
}));

// Search service routes
router.use('/search', createProxyMiddleware({
  target: process.env.SEARCH_SERVICE_URL || 'http://localhost:3009',
  changeOrigin: true,
  pathRewrite: { '^/search': '' }
}));

// Recommendation service routes
router.use('/recommendations', createProxyMiddleware({
  target: process.env.RECOMMENDATION_SERVICE_URL || 'http://localhost:3010',
  changeOrigin: true,
  pathRewrite: { '^/recommendations': '' }
}));

// Analytics service routes
router.use('/analytics', createProxyMiddleware({
  target: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3011',
  changeOrigin: true,
  pathRewrite: { '^/analytics': '' }
}));

// Notification service routes
router.use('/notifications', authMiddleware, createProxyMiddleware({
  target: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3012',
  changeOrigin: true,
  pathRewrite: { '^/notifications': '' }
}));

export default router;
