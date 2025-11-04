import { Request, Response, NextFunction } from 'express';
import { StripeService } from '../services/stripe.service';
import { PayPalService } from '../services/paypal.service';
import { SquareService } from '../services/square.service';
import { CryptoService } from '../services/crypto.service';
import { PaymentRepository } from '../repositories/payment.repository';
import { logger } from '../utils/logger';
import { AppError } from '../utils/appError';
import { publishEvent } from '../config/rabbitmq';

const stripeService = new StripeService();
const paypalService = new PayPalService();
const squareService = new SquareService();
const cryptoService = new CryptoService();
const paymentRepository = new PaymentRepository();

export class PaymentController {
  async createPaymentIntent(req: Request, res: Response, next: NextFunction) {
    try {
      const { amount, currency, paymentMethod, orderId, customerId } = req.body;

      let paymentIntent;
      let provider;

      switch (paymentMethod) {
        case 'stripe':
          paymentIntent = await stripeService.createPaymentIntent(amount, currency);
          provider = 'stripe';
          break;
        case 'paypal':
          paymentIntent = await paypalService.createPayment(amount, currency);
          provider = 'paypal';
          break;
        case 'square':
          paymentIntent = await squareService.createPayment(amount, currency);
          provider = 'square';
          break;
        case 'crypto':
          paymentIntent = await cryptoService.createPayment(amount, currency);
          provider = 'crypto';
          break;
        default:
          throw new AppError('Invalid payment method', 400);
      }

      const payment = await paymentRepository.create({
        orderId,
        customerId,
        amount,
        currency,
        provider,
        status: 'pending',
        paymentIntentId: paymentIntent.id,
        metadata: paymentIntent
      });

      await publishEvent('payment.created', {
        paymentId: payment.id,
        orderId,
        amount,
        currency
      });

      logger.info(`Payment intent created: ${payment.id}`);

      res.status(201).json({
        success: true,
        data: {
          paymentId: payment.id,
          clientSecret: paymentIntent.clientSecret,
          provider
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async confirmPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const { paymentId } = req.params;
      const { paymentMethodId } = req.body;

      const payment = await paymentRepository.findById(paymentId);
      if (!payment) {
        throw new AppError('Payment not found', 404);
      }

      let confirmedPayment;

      switch (payment.provider) {
        case 'stripe':
          confirmedPayment = await stripeService.confirmPayment(
            payment.paymentIntentId,
            paymentMethodId
          );
          break;
        case 'paypal':
          confirmedPayment = await paypalService.executePayment(
            payment.paymentIntentId,
            paymentMethodId
          );
          break;
        case 'square':
          confirmedPayment = await squareService.completePayment(
            payment.paymentIntentId,
            paymentMethodId
          );
          break;
        case 'crypto':
          confirmedPayment = await cryptoService.confirmPayment(
            payment.paymentIntentId
          );
          break;
        default:
          throw new AppError('Invalid payment provider', 400);
      }

      await paymentRepository.update(paymentId, {
        status: 'completed',
        completedAt: new Date(),
        transactionId: confirmedPayment.transactionId
      });

      await publishEvent('payment.completed', {
        paymentId,
        orderId: payment.orderId,
        amount: payment.amount,
        transactionId: confirmedPayment.transactionId
      });

      logger.info(`Payment confirmed: ${paymentId}`);

      res.status(200).json({
        success: true,
        data: {
          paymentId,
          status: 'completed',
          transactionId: confirmedPayment.transactionId
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getPaymentStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { paymentId } = req.params;

      const payment = await paymentRepository.findById(paymentId);
      if (!payment) {
        throw new AppError('Payment not found', 404);
      }

      res.status(200).json({
        success: true,
        data: payment
      });
    } catch (error) {
      next(error);
    }
  }

  async listPayments(req: Request, res: Response, next: NextFunction) {
    try {
      const { customerId, orderId, status, page = 1, limit = 20 } = req.query;

      const filters: any = {};
      if (customerId) filters.customerId = customerId;
      if (orderId) filters.orderId = orderId;
      if (status) filters.status = status;

      const payments = await paymentRepository.findAll(
        filters,
        Number(page),
        Number(limit)
      );

      res.status(200).json({
        success: true,
        data: payments
      });
    } catch (error) {
      next(error);
    }
  }

  async cancelPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const { paymentId } = req.params;

      const payment = await paymentRepository.findById(paymentId);
      if (!payment) {
        throw new AppError('Payment not found', 404);
      }

      if (payment.status === 'completed') {
        throw new AppError('Cannot cancel completed payment', 400);
      }

      switch (payment.provider) {
        case 'stripe':
          await stripeService.cancelPayment(payment.paymentIntentId);
          break;
        case 'paypal':
          await paypalService.cancelPayment(payment.paymentIntentId);
          break;
        case 'square':
          await squareService.cancelPayment(payment.paymentIntentId);
          break;
        case 'crypto':
          await cryptoService.cancelPayment(payment.paymentIntentId);
          break;
      }

      await paymentRepository.update(paymentId, {
        status: 'cancelled',
        cancelledAt: new Date()
      });

      await publishEvent('payment.cancelled', {
        paymentId,
        orderId: payment.orderId
      });

      logger.info(`Payment cancelled: ${paymentId}`);

      res.status(200).json({
        success: true,
        message: 'Payment cancelled successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async createSplitPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const { amount, currency, orderId, customerId, splits } = req.body;

      // Validate splits total equals amount
      const totalSplit = splits.reduce((sum: number, split: any) => sum + split.amount, 0);
      if (totalSplit !== amount) {
        throw new AppError('Split amounts must equal total amount', 400);
      }

      const paymentIntent = await stripeService.createPaymentIntent(amount, currency);

      const payment = await paymentRepository.create({
        orderId,
        customerId,
        amount,
        currency,
        provider: 'stripe',
        status: 'pending',
        paymentIntentId: paymentIntent.id,
        splits,
        metadata: paymentIntent
      });

      logger.info(`Split payment created: ${payment.id}`);

      res.status(201).json({
        success: true,
        data: {
          paymentId: payment.id,
          clientSecret: paymentIntent.clientSecret
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async createInstallmentPlan(req: Request, res: Response, next: NextFunction) {
    try {
      const { amount, currency, orderId, customerId, installments } = req.body;

      const installmentAmount = Math.ceil(amount / installments);

      const plan = await paymentRepository.createInstallmentPlan({
        orderId,
        customerId,
        totalAmount: amount,
        currency,
        installments,
        installmentAmount,
        status: 'active'
      });

      logger.info(`Installment plan created: ${plan.id}`);

      res.status(201).json({
        success: true,
        data: plan
      });
    } catch (error) {
      next(error);
    }
  }

  async processInstallment(req: Request, res: Response, next: NextFunction) {
    try {
      const { planId, installmentNumber } = req.params;

      const plan = await paymentRepository.findInstallmentPlan(planId);
      if (!plan) {
        throw new AppError('Installment plan not found', 404);
      }

      const paymentIntent = await stripeService.createPaymentIntent(
        plan.installmentAmount,
        plan.currency
      );

      const payment = await paymentRepository.create({
        orderId: plan.orderId,
        customerId: plan.customerId,
        amount: plan.installmentAmount,
        currency: plan.currency,
        provider: 'stripe',
        status: 'pending',
        paymentIntentId: paymentIntent.id,
        installmentPlanId: planId,
        installmentNumber: Number(installmentNumber),
        metadata: paymentIntent
      });

      logger.info(`Installment payment created: ${payment.id}`);

      res.status(201).json({
        success: true,
        data: {
          paymentId: payment.id,
          clientSecret: paymentIntent.clientSecret
        }
      });
    } catch (error) {
      next(error);
    }
  }
}
