import { Router } from 'express';
import { RefundController } from '../controllers/refund.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateRefund } from '../validators/refund.validator';

const router = Router();
const refundController = new RefundController();

router.use(authMiddleware);

router.post('/', validateRefund, refundController.createRefund);
router.get('/', refundController.getRefunds);
router.get('/:refundId', refundController.getRefund);
router.post('/:refundId/approve', refundController.approveRefund);
router.post('/:refundId/reject', refundController.rejectRefund);
router.post('/:refundId/process', refundController.processRefund);
router.get('/order/:orderId', refundController.getOrderRefunds);
router.get('/payment/:paymentId', refundController.getPaymentRefunds);

export default router;
