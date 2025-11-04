import { Request, Response, NextFunction } from 'express';
import { StripeService } from '../services/stripe.service';
import { PayPalService } from '../services/paypal.service';
import { SquareService } from '../services/square.service';
import { CryptoService } from '../services/crypto.service';
import { PaymentRepository } from '../repositories/payment.repository';
import { logger } from '../utils/logger';
import { publishEvent } from '../config/rabbitmq';

const stripeService = new StripeService();
const paypalService = new PayPalService();
const squareService = new SquareService();
const cryptoService = new CryptoService();
const paymentRepository = new PaymentRepository();

export class WebhookController {
  async handleStripeWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const signature = req.headers['stripe-signature'] as string;
      const payload = req.body;

      const event = await stripeService.verifyWebhookSignature(
        payload.toString(),
        signature
      );

      logger.info(`Stripe webhook received: ${event.type}`);

      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSuccess(event.data.object, 'stripe');
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailure(event.data.object, 'stripe');
          break;
        case 'charge.refunded':
          await this.handleRefund(event.data.object, 'stripe');
          break;
        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(event.data.object, 'stripe');
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionCancelled(event.data.object, 'stripe');
          break;
        default:
          logger.info(`Unhandled Stripe event type: ${event.type}`);
      }

      res.status(200).json({ received: true });
    } catch (error: any) {
      logger.error('Stripe webhook handling failed:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async handlePayPalWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const headers = req.headers;
      const body = req.body;

      const isValid = paypalService.verifyWebhookSignature(headers, body);

      if (!isValid) {
        return res.status(400).json({ error: 'Invalid signature' });
      }

      logger.info(`PayPal webhook received: ${body.event_type}`);

      switch (body.event_type) {
        case 'PAYMENT.CAPTURE.COMPLETED':
          await this.handlePaymentSuccess(body.resource, 'paypal');
          break;
        case 'PAYMENT.CAPTURE.DENIED':
          await this.handlePaymentFailure(body.resource, 'paypal');
          break;
        case 'PAYMENT.CAPTURE.REFUNDED':
          await this.handleRefund(body.resource, 'paypal');
          break;
        default:
          logger.info(`Unhandled PayPal event type: ${body.event_type}`);
      }

      res.status(200).json({ received: true });
    } catch (error: any) {
      logger.error('PayPal webhook handling failed:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async handleSquareWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const signature = req.headers['x-square-signature'] as string;
      const body = JSON.stringify(req.body);

      const isValid = squareService.verifyWebhookSignature(body, signature);

      if (!isValid) {
        return res.status(400).json({ error: 'Invalid signature' });
      }

      const event = req.body;
      logger.info(`Square webhook received: ${event.type}`);

      switch (event.type) {
        case 'payment.updated':
          if (event.data.object.payment.status === 'COMPLETED') {
            await this.handlePaymentSuccess(event.data.object.payment, 'square');
          } else if (event.data.object.payment.status === 'FAILED') {
            await this.handlePaymentFailure(event.data.object.payment, 'square');
          }
          break;
        case 'refund.updated':
          if (event.data.object.refund.status === 'COMPLETED') {
            await this.handleRefund(event.data.object.refund, 'square');
          }
          break;
        default:
          logger.info(`Unhandled Square event type: ${event.type}`);
      }

      res.status(200).json({ received: true });
    } catch (error: any) {
      logger.error('Square webhook handling failed:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async handleCryptoWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const { transactionHash, status, amount, address } = req.body;

      logger.info(`Crypto webhook received: ${transactionHash}`);

      if (status === 'confirmed') {
        await this.handleCryptoPaymentSuccess(transactionHash, amount, address);
      } else if (status === 'failed') {
        await this.handleCryptoPaymentFailure(transactionHash);
      }

      res.status(200).json({ received: true });
    } catch (error: any) {
      logger.error('Crypto webhook handling failed:', error);
      res.status(400).json({ error: error.message });
    }
  }

  private async handlePaymentSuccess(paymentData: any, provider: string) {
    try {
      const payment = await paymentRepository.findByPaymentIntentId(paymentData.id);

      if (!payment) {
        logger.warn(`Payment not found for ${provider} payment intent: ${paymentData.id}`);
        return;
      }

      await paymentRepository.update(payment.id, {
        status: 'completed',
        completedAt: new Date(),
        transactionId: paymentData.id
      });

      await publishEvent('payment.completed', {
        paymentId: payment.id,
        orderId: payment.orderId,
        amount: payment.amount,
        provider
      });

      logger.info(`Payment completed via webhook: ${payment.id}`);
    } catch (error: any) {
      logger.error('Payment success handling failed:', error);
    }
  }

  private async handlePaymentFailure(paymentData: any, provider: string) {
    try {
      const payment = await paymentRepository.findByPaymentIntentId(paymentData.id);

      if (!payment) {
        logger.warn(`Payment not found for ${provider} payment intent: ${paymentData.id}`);
        return;
      }

      await paymentRepository.update(payment.id, {
        status: 'failed',
        failedAt: new Date(),
        failureReason: paymentData.failure_message || 'Payment failed'
      });

      await publishEvent('payment.failed', {
        paymentId: payment.id,
        orderId: payment.orderId,
        reason: paymentData.failure_message
      });

      logger.info(`Payment failed via webhook: ${payment.id}`);
    } catch (error: any) {
      logger.error('Payment failure handling failed:', error);
    }
  }

  private async handleRefund(refundData: any, provider: string) {
    try {
      const payment = await paymentRepository.findByTransactionId(refundData.payment_intent || refundData.id);

      if (!payment) {
        logger.warn(`Payment not found for ${provider} refund`);
        return;
      }

      await paymentRepository.update(payment.id, {
        status: 'refunded',
        refundedAt: new Date(),
        refundAmount: refundData.amount / 100
      });

      await publishEvent('payment.refunded', {
        paymentId: payment.id,
        orderId: payment.orderId,
        refundAmount: refundData.amount / 100
      });

      logger.info(`Payment refunded via webhook: ${payment.id}`);
    } catch (error: any) {
      logger.error('Refund handling failed:', error);
    }
  }

  private async handleSubscriptionCreated(subscriptionData: any, provider: string) {
    try {
      await publishEvent('subscription.created', {
        subscriptionId: subscriptionData.id,
        customerId: subscriptionData.customer,
        provider
      });

      logger.info(`Subscription created via webhook: ${subscriptionData.id}`);
    } catch (error: any) {
      logger.error('Subscription creation handling failed:', error);
    }
  }

  private async handleSubscriptionCancelled(subscriptionData: any, provider: string) {
    try {
      await publishEvent('subscription.cancelled', {
        subscriptionId: subscriptionData.id,
        customerId: subscriptionData.customer,
        provider
      });

      logger.info(`Subscription cancelled via webhook: ${subscriptionData.id}`);
    } catch (error: any) {
      logger.error('Subscription cancellation handling failed:', error);
    }
  }

  private async handleCryptoPaymentSuccess(transactionHash: string, amount: number, address: string) {
    try {
      const payment = await paymentRepository.findByMetadata({ paymentAddress: address });

      if (!payment) {
        logger.warn(`Payment not found for crypto transaction: ${transactionHash}`);
        return;
      }

      await paymentRepository.update(payment.id, {
        status: 'completed',
        completedAt: new Date(),
        transactionId: transactionHash
      });

      await publishEvent('payment.completed', {
        paymentId: payment.id,
        orderId: payment.orderId,
        amount,
        provider: 'crypto'
      });

      logger.info(`Crypto payment completed via webhook: ${payment.id}`);
    } catch (error: any) {
      logger.error('Crypto payment success handling failed:', error);
    }
  }

  private async handleCryptoPaymentFailure(transactionHash: string) {
    try {
      logger.info(`Crypto payment failed: ${transactionHash}`);
    } catch (error: any) {
      logger.error('Crypto payment failure handling failed:', error);
    }
  }
}
