import { PaymentModel, Payment } from '../models/payment.model';
import { StripeService } from './stripe.service';
import { PayPalService } from './paypal.service';
import { SquareService } from './square.service';
import { CryptoService } from './crypto.service';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';

export class PaymentService {
  private paymentModel: PaymentModel;
  private stripeService: StripeService;
  private paypalService: PayPalService;
  private squareService: SquareService;
  private cryptoService: CryptoService;

  constructor() {
    this.paymentModel = new PaymentModel();
    this.stripeService = new StripeService();
    this.paypalService = new PayPalService();
    this.squareService = new SquareService();
    this.cryptoService = new CryptoService();
  }

  async createPayment(
    orderId: string,
    userId: string,
    amount: number,
    currency: string,
    provider: Payment['provider'],
    paymentMethod: string
  ): Promise<Payment> {
    try {
      const payment = await this.paymentModel.create({
        orderId,
        userId,
        amount,
        currency,
        provider,
        paymentMethod,
        status: 'pending'
      });

      logger.info(`Payment created: ${payment.id}`);
      return payment;
    } catch (error) {
      logger.error('Error creating payment:', error);
      throw error;
    }
  }

  async processPayment(paymentId: string, paymentDetails: any): Promise<Payment> {
    try {
      const payment = await this.paymentModel.findById(paymentId);
      
      if (!payment) {
        throw new AppError('Payment not found', 404);
      }

      if (payment.status !== 'pending') {
        throw new AppError('Payment already processed', 400);
      }

      await this.paymentModel.update(paymentId, { status: 'processing' });

      let transactionId: string;

      switch (payment.provider) {
        case 'stripe':
          transactionId = await this.stripeService.processPayment(
            payment.amount,
            payment.currency,
            paymentDetails
          );
          break;
        case 'paypal':
          transactionId = await this.paypalService.processPayment(
            payment.amount,
            payment.currency,
            paymentDetails
          );
          break;
        case 'square':
          transactionId = await this.squareService.processPayment(
            payment.amount,
            payment.currency,
            paymentDetails
          );
          break;
        case 'crypto':
          transactionId = await this.cryptoService.processPayment(
            payment.amount,
            paymentDetails
          );
          break;
        default:
          throw new AppError('Unsupported payment provider', 400);
      }

      const updatedPayment = await this.paymentModel.update(paymentId, {
        status: 'completed',
        transactionId,
        completedAt: new Date()
      });

      logger.info(`Payment processed: ${paymentId}`);
      return updatedPayment;
    } catch (error) {
      logger.error('Error processing payment:', error);
      await this.paymentModel.update(paymentId, { status: 'failed' });
      throw error;
    }
  }

  async getPayment(paymentId: string): Promise<Payment> {
    try {
      const payment = await this.paymentModel.findById(paymentId);
      
      if (!payment) {
        throw new AppError('Payment not found', 404);
      }

      return payment;
    } catch (error) {
      logger.error('Error fetching payment:', error);
      throw error;
    }
  }

  async getOrderPayments(orderId: string): Promise<Payment[]> {
    try {
      return await this.paymentModel.findByOrderId(orderId);
    } catch (error) {
      logger.error('Error fetching order payments:', error);
      throw error;
    }
  }

  async getUserPayments(userId: string): Promise<Payment[]> {
    try {
      return await this.paymentModel.findByUserId(userId);
    } catch (error) {
      logger.error('Error fetching user payments:', error);
      throw error;
    }
  }
}
