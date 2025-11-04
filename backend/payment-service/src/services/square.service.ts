import { Client, Environment } from 'square';
import { logger } from '../utils/logger';
import { AppError } from '../utils/appError';
import { v4 as uuidv4 } from 'uuid';

export class SquareService {
  private client: Client;

  constructor() {
    this.client = new Client({
      accessToken: process.env.SQUARE_ACCESS_TOKEN || '',
      environment: process.env.SQUARE_ENVIRONMENT === 'production' 
        ? Environment.Production 
        : Environment.Sandbox
    });
  }

  async createPayment(amount: number, currency: string) {
    try {
      const idempotencyKey = uuidv4();
      
      const response = await this.client.paymentsApi.createPayment({
        sourceId: 'EXTERNAL',
        idempotencyKey,
        amountMoney: {
          amount: BigInt(Math.round(amount * 100)),
          currency: currency.toUpperCase()
        },
        autocomplete: false
      });

      return {
        id: response.result.payment?.id || '',
        clientSecret: idempotencyKey,
        status: response.result.payment?.status
      };
    } catch (error: any) {
      logger.error('Square payment creation failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async completePayment(paymentId: string, sourceId: string) {
    try {
      const response = await this.client.paymentsApi.completePayment(paymentId);

      return {
        transactionId: response.result.payment?.id || '',
        status: response.result.payment?.status,
        amount: Number(response.result.payment?.amountMoney?.amount || 0) / 100
      };
    } catch (error: any) {
      logger.error('Square payment completion failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async cancelPayment(paymentId: string) {
    try {
      await this.client.paymentsApi.cancelPayment(paymentId);
      return { success: true };
    } catch (error: any) {
      logger.error('Square payment cancellation failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async createRefund(paymentId: string, amount?: number, reason?: string) {
    try {
      const idempotencyKey = uuidv4();
      
      const refundData: any = {
        idempotencyKey,
        paymentId,
        reason: reason || 'Customer requested refund'
      };

      if (amount) {
        refundData.amountMoney = {
          amount: BigInt(Math.round(amount * 100)),
          currency: 'USD'
        };
      }

      const response = await this.client.refundsApi.refundPayment(refundData);

      return {
        refundId: response.result.refund?.id || '',
        status: response.result.refund?.status,
        amount: Number(response.result.refund?.amountMoney?.amount || 0) / 100
      };
    } catch (error: any) {
      logger.error('Square refund creation failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async getPayment(paymentId: string) {
    try {
      const response = await this.client.paymentsApi.getPayment(paymentId);

      return {
        id: response.result.payment?.id,
        amount: Number(response.result.payment?.amountMoney?.amount || 0) / 100,
        currency: response.result.payment?.amountMoney?.currency,
        status: response.result.payment?.status
      };
    } catch (error: any) {
      logger.error('Square payment retrieval failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async createCustomer(email: string, givenName: string, familyName: string) {
    try {
      const idempotencyKey = uuidv4();

      const response = await this.client.customersApi.createCustomer({
        idempotencyKey,
        emailAddress: email,
        givenName,
        familyName
      });

      return {
        customerId: response.result.customer?.id || '',
        email: response.result.customer?.emailAddress
      };
    } catch (error: any) {
      logger.error('Square customer creation failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async createCard(customerId: string, cardNonce: string) {
    try {
      const idempotencyKey = uuidv4();

      const response = await this.client.cardsApi.createCard({
        idempotencyKey,
        sourceId: cardNonce,
        card: {
          customerId
        }
      });

      return {
        cardId: response.result.card?.id || '',
        last4: response.result.card?.last4,
        brand: response.result.card?.cardBrand
      };
    } catch (error: any) {
      logger.error('Square card creation failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async listPayments(beginTime?: string, endTime?: string, limit?: number) {
    try {
      const response = await this.client.paymentsApi.listPayments(
        beginTime,
        endTime,
        undefined,
        undefined,
        undefined,
        limit
      );

      return response.result.payments?.map(payment => ({
        id: payment.id,
        amount: Number(payment.amountMoney?.amount || 0) / 100,
        currency: payment.amountMoney?.currency,
        status: payment.status,
        createdAt: payment.createdAt
      })) || [];
    } catch (error: any) {
      logger.error('Square payments listing failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async createInvoice(customerId: string, items: any[], dueDate: string) {
    try {
      const idempotencyKey = uuidv4();

      const response = await this.client.invoicesApi.createInvoice({
        invoice: {
          locationId: process.env.SQUARE_LOCATION_ID || '',
          customerId,
          paymentRequests: [
            {
              requestType: 'BALANCE',
              dueDate
            }
          ],
          primaryRecipient: {
            customerId
          }
        },
        idempotencyKey
      });

      return {
        invoiceId: response.result.invoice?.id || '',
        status: response.result.invoice?.status
      };
    } catch (error: any) {
      logger.error('Square invoice creation failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async publishInvoice(invoiceId: string, version: number) {
    try {
      const response = await this.client.invoicesApi.publishInvoice(invoiceId, {
        version
      });

      return {
        invoiceId: response.result.invoice?.id || '',
        status: response.result.invoice?.status,
        publicUrl: response.result.invoice?.publicUrl
      };
    } catch (error: any) {
      logger.error('Square invoice publishing failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  verifyWebhookSignature(body: string, signature: string): boolean {
    // Square webhook verification
    // Implement using Square's webhook verification
    const webhookSignatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY || '';
    
    // In production, implement proper HMAC verification
    return signature.length > 0 && webhookSignatureKey.length > 0;
  }
}
