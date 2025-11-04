import { Router } from 'express';
import { OrderController } from '../controllers/order.controller';
import { CartController } from '../controllers/cart.controller';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { rateLimitMiddleware } from '../middleware/rateLimit.middleware';
import {
  createOrderSchema,
  updateOrderSchema,
  cancelOrderSchema,
  refundRequestSchema,
  orderQuerySchema
} from '../validators/order.validator';

const router = Router();
const orderController = new OrderController();
const cartController = new CartController();

// All routes require authentication
router.use(authMiddleware);

// Cart routes
router.get('/cart', cartController.getCart);
router.post('/cart/items', cartController.addItem);
router.patch('/cart/items/:itemId', cartController.updateItem);
router.delete('/cart/items/:itemId', cartController.removeItem);
router.delete('/cart', cartController.clearCart);
router.post('/cart/apply-coupon', cartController.applyCoupon);
router.delete('/cart/coupon', cartController.removeCoupon);

// Order routes
router.post(
  '/',
  rateLimitMiddleware({ windowMs: 60 * 1000, max: 10 }),
  validateRequest(createOrderSchema),
  orderController.createOrder
);

router.get(
  '/',
  validateRequest(orderQuerySchema, 'query'),
  orderController.getUserOrders
);

router.get('/stats', orderController.getOrderStats);

router.get('/:orderId', orderController.getOrder);

router.patch(
  '/:orderId',
  validateRequest(updateOrderSchema),
  orderController.updateOrder
);

router.post(
  '/:orderId/cancel',
  validateRequest(cancelOrderSchema),
  orderController.cancelOrder
);

router.post(
  '/:orderId/refund',
  validateRequest(refundRequestSchema),
  orderController.requestRefund
);

router.get('/:orderId/tracking', orderController.getTracking);

router.get('/:orderId/invoice', orderController.getInvoice);

router.post('/:orderId/review', orderController.submitReview);

// Seller routes
router.get(
  '/seller/orders',
  requireRole(['SELLER', 'ADMIN']),
  orderController.getSellerOrders
);

router.patch(
  '/seller/:orderId/status',
  requireRole(['SELLER', 'ADMIN']),
  orderController.updateOrderStatus
);

router.post(
  '/seller/:orderId/ship',
  requireRole(['SELLER', 'ADMIN']),
  orderController.shipOrder
);

router.post(
  '/seller/:orderId/deliver',
  requireRole(['SELLER', 'ADMIN']),
  orderController.deliverOrder
);

router.get(
  '/seller/analytics',
  requireRole(['SELLER', 'ADMIN']),
  orderController.getSellerAnalytics
);

// Admin routes
router.get(
  '/admin/all',
  requireRole(['ADMIN', 'SUPPORT']),
  orderController.getAllOrders
);

router.get(
  '/admin/analytics',
  requireRole(['ADMIN']),
  orderController.getAdminAnalytics
);

router.post(
  '/admin/:orderId/refund/:refundId/process',
  requireRole(['ADMIN']),
  orderController.processRefund
);

router.patch(
  '/admin/:orderId/payment-status',
  requireRole(['ADMIN']),
  orderController.updatePaymentStatus
);

router.delete(
  '/admin/:orderId',
  requireRole(['ADMIN']),
  orderController.deleteOrder
);

export default router;
