import Stripe from 'stripe';
import { logger } from '../utils/logger';
import { AppError } from '../utils/appError';

export class StripeService {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2023-10-16'
    });
  }

  async createPaymentIntent(amount: number, currency: string) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        automatic_payment_methods: {
          enabled: true
        }
      });

      return {
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        status: paymentIntent.status
      };
    } catch (error: any) {
      logger.error('Stripe payment intent creation failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async confirmPayment(paymentIntentId: string, paymentMethodId: string) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.confirm(paymentIntentId, {
        payment_method: paymentMethodId
      });

      return {
        transactionId: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100
      };
    } catch (error: any) {
      logger.error('Stripe payment confirmation failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async cancelPayment(paymentIntentId: string) {
    try {
      await this.stripe.paymentIntents.cancel(paymentIntentId);
      return { success: true };
    } catch (error: any) {
      logger.error('Stripe payment cancellation failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async createRefund(paymentIntentId: string, amount?: number) {
    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amount ? Math.round(amount * 100) : undefined
      });

      return {
        refundId: refund.id,
        status: refund.status,
        amount: refund.amount / 100
      };
    } catch (error: any) {
      logger.error('Stripe refund creation failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async createCustomer(email: string, name: string, metadata?: any) {
    try {
      const customer = await this.stripe.customers.create({
        email,
        name,
        metadata
      });

      return {
        customerId: customer.id,
        email: customer.email
      };
    } catch (error: any) {
      logger.error('Stripe customer creation failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async attachPaymentMethod(customerId: string, paymentMethodId: string) {
    try {
      await this.stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId
      });

      return { success: true };
    } catch (error: any) {
      logger.error('Stripe payment method attachment failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async createSubscription(customerId: string, priceId: string) {
    try {
      const subscription = await this.stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent']
      });

      return {
        subscriptionId: subscription.id,
        status: subscription.status,
        clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret
      };
    } catch (error: any) {
      logger.error('Stripe subscription creation failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async createTransfer(amount: number, destination: string, currency: string) {
    try {
      const transfer = await this.stripe.transfers.create({
        amount: Math.round(amount * 100),
        currency: currency.toLowerCase(),
        destination
      });

      return {
        transferId: transfer.id,
        amount: transfer.amount / 100,
        status: 'completed'
      };
    } catch (error: any) {
      logger.error('Stripe transfer creation failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async createPayout(amount: number, currency: string) {
    try {
      const payout = await this.stripe.payouts.create({
        amount: Math.round(amount * 100),
        currency: currency.toLowerCase()
      });

      return {
        payoutId: payout.id,
        amount: payout.amount / 100,
        status: payout.status
      };
    } catch (error: any) {
      logger.error('Stripe payout creation failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async verifyWebhookSignature(payload: string, signature: string): Promise<any> {
    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET || ''
      );
      return event;
    } catch (error: any) {
      logger.error('Stripe webhook verification failed:', error);
      throw new AppError('Invalid webhook signature', 400);
    }
  }

  async retrievePaymentIntent(paymentIntentId: string) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      return {
        id: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        status: paymentIntent.status
      };
    } catch (error: any) {
      logger.error('Stripe payment intent retrieval failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async createConnectedAccount(email: string, country: string, type: 'express' | 'standard') {
    try {
      const account = await this.stripe.accounts.create({
        type,
        country,
        email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true }
        }
      });

      return {
        accountId: account.id,
        type: account.type
      };
    } catch (error: any) {
      logger.error('Stripe connected account creation failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async createAccountLink(accountId: string, refreshUrl: string, returnUrl: string) {
    try {
      const accountLink = await this.stripe.accountLinks.create({
        account: accountId,
        refresh_url: refreshUrl,
        return_url: returnUrl,
        type: 'account_onboarding'
      });

      return {
        url: accountLink.url
      };
    } catch (error: any) {
      logger.error('Stripe account link creation failed:', error);
      throw new AppError(error.message, 500);
    }
  }
}
