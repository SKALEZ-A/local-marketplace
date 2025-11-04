import paypal from 'paypal-rest-sdk';
import { logger } from '../utils/logger';
import { AppError } from '../utils/appError';

export class PayPalService {
  constructor() {
    paypal.configure({
      mode: process.env.PAYPAL_MODE || 'sandbox',
      client_id: process.env.PAYPAL_CLIENT_ID || '',
      client_secret: process.env.PAYPAL_CLIENT_SECRET || ''
    });
  }

  async createPayment(amount: number, currency: string) {
    return new Promise((resolve, reject) => {
      const createPaymentJson = {
        intent: 'sale',
        payer: {
          payment_method: 'paypal'
        },
        redirect_urls: {
          return_url: process.env.PAYPAL_RETURN_URL || 'http://localhost:3000/success',
          cancel_url: process.env.PAYPAL_CANCEL_URL || 'http://localhost:3000/cancel'
        },
        transactions: [
          {
            amount: {
              currency,
              total: amount.toFixed(2)
            },
            description: 'Marketplace payment'
          }
        ]
      };

      paypal.payment.create(createPaymentJson, (error, payment) => {
        if (error) {
          logger.error('PayPal payment creation failed:', error);
          reject(new AppError(error.message, 500));
        } else {
          const approvalUrl = payment.links?.find(link => link.rel === 'approval_url')?.href;
          resolve({
            id: payment.id,
            clientSecret: approvalUrl,
            status: payment.state
          });
        }
      });
    });
  }

  async executePayment(paymentId: string, payerId: string) {
    return new Promise((resolve, reject) => {
      const executePaymentJson = {
        payer_id: payerId
      };

      paypal.payment.execute(paymentId, executePaymentJson, (error, payment) => {
        if (error) {
          logger.error('PayPal payment execution failed:', error);
          reject(new AppError(error.message, 500));
        } else {
          resolve({
            transactionId: payment.id,
            status: payment.state,
            amount: parseFloat(payment.transactions?.[0]?.amount?.total || '0')
          });
        }
      });
    });
  }

  async cancelPayment(paymentId: string) {
    // PayPal doesn't have a direct cancel API for pending payments
    // They expire automatically after 3 hours
    logger.info(`PayPal payment ${paymentId} marked for cancellation`);
    return { success: true };
  }

  async createRefund(saleId: string, amount?: number) {
    return new Promise((resolve, reject) => {
      const refundData: any = {};
      if (amount) {
        refundData.amount = {
          total: amount.toFixed(2),
          currency: 'USD'
        };
      }

      paypal.sale.refund(saleId, refundData, (error, refund) => {
        if (error) {
          logger.error('PayPal refund creation failed:', error);
          reject(new AppError(error.message, 500));
        } else {
          resolve({
            refundId: refund.id,
            status: refund.state,
            amount: parseFloat(refund.amount?.total || '0')
          });
        }
      });
    });
  }

  async getPaymentDetails(paymentId: string) {
    return new Promise((resolve, reject) => {
      paypal.payment.get(paymentId, (error, payment) => {
        if (error) {
          logger.error('PayPal payment retrieval failed:', error);
          reject(new AppError(error.message, 500));
        } else {
          resolve({
            id: payment.id,
            state: payment.state,
            amount: parseFloat(payment.transactions?.[0]?.amount?.total || '0'),
            currency: payment.transactions?.[0]?.amount?.currency
          });
        }
      });
    });
  }

  async createBillingPlan(name: string, description: string, amount: number, currency: string, interval: string) {
    return new Promise((resolve, reject) => {
      const billingPlanAttributes = {
        name,
        description,
        type: 'INFINITE',
        payment_definitions: [
          {
            name: 'Regular payment',
            type: 'REGULAR',
            frequency: interval.toUpperCase(),
            frequency_interval: '1',
            amount: {
              value: amount.toFixed(2),
              currency
            },
            cycles: '0'
          }
        ],
        merchant_preferences: {
          return_url: process.env.PAYPAL_RETURN_URL || 'http://localhost:3000/success',
          cancel_url: process.env.PAYPAL_CANCEL_URL || 'http://localhost:3000/cancel',
          auto_bill_amount: 'YES',
          initial_fail_amount_action: 'CONTINUE',
          max_fail_attempts: '3'
        }
      };

      paypal.billingPlan.create(billingPlanAttributes, (error, billingPlan) => {
        if (error) {
          logger.error('PayPal billing plan creation failed:', error);
          reject(new AppError(error.message, 500));
        } else {
          resolve({
            planId: billingPlan.id,
            state: billingPlan.state
          });
        }
      });
    });
  }

  async activateBillingPlan(planId: string) {
    return new Promise((resolve, reject) => {
      const billingPlanUpdateAttributes = [
        {
          op: 'replace',
          path: '/',
          value: {
            state: 'ACTIVE'
          }
        }
      ];

      paypal.billingPlan.update(planId, billingPlanUpdateAttributes, (error) => {
        if (error) {
          logger.error('PayPal billing plan activation failed:', error);
          reject(new AppError(error.message, 500));
        } else {
          resolve({ success: true });
        }
      });
    });
  }

  async createBillingAgreement(planId: string, name: string, description: string, startDate: Date) {
    return new Promise((resolve, reject) => {
      const billingAgreementAttributes = {
        name,
        description,
        start_date: startDate.toISOString(),
        plan: {
          id: planId
        },
        payer: {
          payment_method: 'paypal'
        }
      };

      paypal.billingAgreement.create(billingAgreementAttributes, (error, billingAgreement) => {
        if (error) {
          logger.error('PayPal billing agreement creation failed:', error);
          reject(new AppError(error.message, 500));
        } else {
          const approvalUrl = billingAgreement.links?.find(link => link.rel === 'approval_url')?.href;
          resolve({
            agreementId: billingAgreement.id,
            approvalUrl
          });
        }
      });
    });
  }

  async executeBillingAgreement(token: string) {
    return new Promise((resolve, reject) => {
      paypal.billingAgreement.execute(token, {}, (error, billingAgreement) => {
        if (error) {
          logger.error('PayPal billing agreement execution failed:', error);
          reject(new AppError(error.message, 500));
        } else {
          resolve({
            agreementId: billingAgreement.id,
            state: billingAgreement.state
          });
        }
      });
    });
  }

  verifyWebhookSignature(headers: any, body: any): boolean {
    // PayPal webhook verification logic
    // This is a simplified version
    const transmissionId = headers['paypal-transmission-id'];
    const transmissionTime = headers['paypal-transmission-time'];
    const certUrl = headers['paypal-cert-url'];
    const transmissionSig = headers['paypal-transmission-sig'];
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;

    if (!transmissionId || !transmissionTime || !certUrl || !transmissionSig || !webhookId) {
      return false;
    }

    // In production, implement full webhook verification
    // using PayPal SDK's webhook verification methods
    return true;
  }
}
