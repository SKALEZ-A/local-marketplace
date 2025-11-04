import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { paymentValidation } from '../validators/payment.validator';

const router = Router();
const paymentController = new PaymentController();

// Create payment intent
router.post(
  '/intent',
  authenticate,
  validateRequest(paymentValidation.createPaymentIntent),
  paymentController.createPaymentIntent.bind(paymentController)
);

// Confirm payment
router.post(
  '/:paymentId/confirm',
  authenticate,
  validateRequest(paymentValidation.confirmPayment),
  paymentController.confirmPayment.bind(paymentController)
);

// Get payment status
router.get(
  '/:paymentId',
  authenticate,
  paymentController.getPaymentStatus.bind(paymentController)
);

// List payments
router.get(
  '/',
  authenticate,
  paymentController.listPayments.bind(paymentController)
);

// Cancel payment
router.post(
  '/:paymentId/cancel',
  authenticate,
  paymentController.cancelPayment.bind(paymentController)
);

// Create split payment
router.post(
  '/split',
  authenticate,
  validateRequest(paymentValidation.createSplitPayment),
  paymentController.createSplitPayment.bind(paymentController)
);

// Create installment plan
router.post(
  '/installment/plan',
  authenticate,
  validateRequest(paymentValidation.createInstallmentPlan),
  paymentController.createInstallmentPlan.bind(paymentController)
);

// Process installment
router.post(
  '/installment/:planId/:installmentNumber',
  authenticate,
  paymentController.processInstallment.bind(paymentController)
);

export default router;
