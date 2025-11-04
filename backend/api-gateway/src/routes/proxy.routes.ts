import { Router } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { authMiddleware } from '../middleware/auth.middleware';
import { rateLimitMiddleware } from '../middleware/rateLimit.middleware';

const router = Router();

// Auth Service Routes
router.use('/auth', rateLimitMiddleware, createProxyMiddleware({
  target: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  changeOrigin: true,
  pathRewrite: { '^/auth': '' }
}));

// Product Service Routes
router.use('/products', rateLimitMiddleware, createProxyMiddleware({
  target: process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002',
  changeOrigin: true,
  pathRewrite: { '^/products': '' }
}));

// Order Service Routes
router.use('/orders', authMiddleware, rateLimitMiddleware, createProxyMiddleware({
  target: process.env.ORDER_SERVICE_URL || 'http://localhost:3003',
  changeOrigin: true,
  pathRewrite: { '^/orders': '' }
}));

// Payment Service Routes
router.use('/payments', authMiddleware, rateLimitMiddleware, createProxyMiddleware({
  target: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3004',
  changeOrigin: true,
  pathRewrite: { '^/payments': '' }
}));

// Delivery Service Routes
router.use('/deliveries', authMiddleware, rateLimitMiddleware, createProxyMiddleware({
  target: process.env.DELIVERY_SERVICE_URL || 'http://localhost:3005',
  changeOrigin: true,
  pathRewrite: { '^/deliveries': '' }
}));

// Chat Service Routes
router.use('/chat', authMiddleware, rateLimitMiddleware, createProxyMiddleware({
  target: process.env.CHAT_SERVICE_URL || 'http://localhost:3006',
  changeOrigin: true,
  pathRewrite: { '^/chat': '' }
}));

// Notification Service Routes
router.use('/notifications', authMiddleware, rateLimitMiddleware, createProxyMiddleware({
  target: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3007',
  changeOrigin: true,
  pathRewrite: { '^/notifications': '' }
}));

// Review Service Routes
router.use('/reviews', rateLimitMiddleware, createProxyMiddleware({
  target: process.env.REVIEW_SERVICE_URL || 'http://localhost:3008',
  changeOrigin: true,
  pathRewrite: { '^/reviews': '' }
}));

// Search Service Routes
router.use('/search', rateLimitMiddleware, createProxyMiddleware({
  target: process.env.SEARCH_SERVICE_URL || 'http://localhost:3009',
  changeOrigin: true,
  pathRewrite: { '^/search': '' }
}));

// Analytics Service Routes
router.use('/analytics', authMiddleware, rateLimitMiddleware, createProxyMiddleware({
  target: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3010',
  changeOrigin: true,
  pathRewrite: { '^/analytics': '' }
}));

// Recommendation Service Routes
router.use('/recommendations', rateLimitMiddleware, createProxyMiddleware({
  target: process.env.RECOMMENDATION_SERVICE_URL || 'http://localhost:3011',
  changeOrigin: true,
  pathRewrite: { '^/recommendations': '' }
}));

export default router;
