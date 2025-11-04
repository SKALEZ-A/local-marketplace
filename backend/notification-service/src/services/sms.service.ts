import twilio from 'twilio';
import { logger } from '../utils/logger';
import { AppError } from '../utils/appError';

export class SMSService {
  private client: twilio.Twilio;
  private fromNumber: string;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID || '';
    const authToken = process.env.TWILIO_AUTH_TOKEN || '';
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER || '';

    this.client = twilio(accountSid, authToken);
  }

  async sendSMS(to: string, message: string) {
    try {
      const result = await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to
      });

      logger.info(`SMS sent: ${result.sid}`);

      return {
        messageId: result.sid,
        status: result.status,
        to: result.to
      };
    } catch (error: any) {
      logger.error('SMS sending failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async sendBulkSMS(recipients: string[], message: string) {
    const results = [];

    for (const recipient of recipients) {
      try {
        const result = await this.sendSMS(recipient, message);
        results.push({ phone: recipient, success: true, messageId: result.messageId });
      } catch (error: any) {
        results.push({ phone: recipient, success: false, error: error.message });
      }
    }

    return results;
  }

  async sendOTP(to: string, otp: string) {
    const message = `Your verification code is: ${otp}. This code will expire in 10 minutes.`;
    return await this.sendSMS(to, message);
  }

  async sendOrderConfirmation(to: string, orderNumber: string) {
    const message = `Your order #${orderNumber} has been confirmed. Track your order at ${process.env.FRONTEND_URL}/orders/${orderNumber}`;
    return await this.sendSMS(to, message);
  }

  async sendOrderShipped(to: string, orderNumber: string, trackingNumber: string) {
    const message = `Your order #${orderNumber} has shipped! Tracking: ${trackingNumber}`;
    return await this.sendSMS(to, message);
  }

  async sendOrderDelivered(to: string, orderNumber: string) {
    const message = `Your order #${orderNumber} has been delivered. Thank you for shopping with us!`;
    return await this.sendSMS(to, message);
  }

  async sendPaymentConfirmation(to: string, amount: number, currency: string) {
    const message = `Payment of ${currency} ${amount.toFixed(2)} has been processed successfully.`;
    return await this.sendSMS(to, message);
  }

  async sendRefundNotification(to: string, amount: number, currency: string) {
    const message = `A refund of ${currency} ${amount.toFixed(2)} has been processed to your account.`;
    return await this.sendSMS(to, message);
  }

  async sendPasswordResetCode(to: string, code: string) {
    const message = `Your password reset code is: ${code}. Do not share this code with anyone.`;
    return await this.sendSMS(to, message);
  }

  async sendAccountVerification(to: string, code: string) {
    const message = `Your account verification code is: ${code}. Enter this code to verify your account.`;
    return await this.sendSMS(to, message);
  }

  async sendPriceDropAlert(to: string, productName: string, newPrice: number, currency: string) {
    const message = `Price drop alert! ${productName} is now ${currency} ${newPrice.toFixed(2)}. Shop now: ${process.env.FRONTEND_URL}`;
    return await this.sendSMS(to, message);
  }

  async sendBackInStockAlert(to: string, productName: string) {
    const message = `${productName} is back in stock! Order now: ${process.env.FRONTEND_URL}`;
    return await this.sendSMS(to, message);
  }

  async sendDeliveryUpdate(to: string, orderNumber: string, status: string, estimatedTime?: string) {
    let message = `Delivery update for order #${orderNumber}: ${status}`;
    if (estimatedTime) {
      message += `. Estimated arrival: ${estimatedTime}`;
    }
    return await this.sendSMS(to, message);
  }

  async sendPromotionalSMS(to: string, message: string) {
    const fullMessage = `${message}\n\nReply STOP to unsubscribe`;
    return await this.sendSMS(to, fullMessage);
  }

  async sendAppointmentReminder(to: string, appointmentDate: string, appointmentTime: string) {
    const message = `Reminder: You have an appointment on ${appointmentDate} at ${appointmentTime}.`;
    return await this.sendSMS(to, message);
  }

  async sendSecurityAlert(to: string, alertType: string) {
    const message = `Security Alert: ${alertType}. If this wasn't you, please contact support immediately.`;
    return await this.sendSMS(to, message);
  }

  async sendLowBalanceAlert(to: string, balance: number, currency: string) {
    const message = `Your account balance is low: ${currency} ${balance.toFixed(2)}. Please add funds to continue.`;
    return await this.sendSMS(to, message);
  }

  async sendSubscriptionRenewal(to: string, planName: string, renewalDate: string) {
    const message = `Your ${planName} subscription will renew on ${renewalDate}.`;
    return await this.sendSMS(to, message);
  }

  async sendSubscriptionExpiry(to: string, planName: string, expiryDate: string) {
    const message = `Your ${planName} subscription will expire on ${expiryDate}. Renew now to continue enjoying benefits.`;
    return await this.sendSMS(to, message);
  }

  async getMessageStatus(messageSid: string) {
    try {
      const message = await this.client.messages(messageSid).fetch();

      return {
        sid: message.sid,
        status: message.status,
        to: message.to,
        from: message.from,
        dateSent: message.dateSent,
        errorCode: message.errorCode,
        errorMessage: message.errorMessage
      };
    } catch (error: any) {
      logger.error('Message status retrieval failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async sendWhatsAppMessage(to: string, message: string) {
    try {
      const result = await this.client.messages.create({
        body: message,
        from: `whatsapp:${this.fromNumber}`,
        to: `whatsapp:${to}`
      });

      logger.info(`WhatsApp message sent: ${result.sid}`);

      return {
        messageId: result.sid,
        status: result.status,
        to: result.to
      };
    } catch (error: any) {
      logger.error('WhatsApp message sending failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async sendMMSWithImage(to: string, message: string, mediaUrl: string) {
    try {
      const result = await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to,
        mediaUrl: [mediaUrl]
      });

      logger.info(`MMS sent: ${result.sid}`);

      return {
        messageId: result.sid,
        status: result.status,
        to: result.to
      };
    } catch (error: any) {
      logger.error('MMS sending failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async verifyPhoneNumber(phoneNumber: string, channel: 'sms' | 'call' = 'sms') {
    try {
      const verification = await this.client.verify.v2
        .services(process.env.TWILIO_VERIFY_SERVICE_SID || '')
        .verifications.create({
          to: phoneNumber,
          channel
        });

      return {
        status: verification.status,
        to: verification.to,
        channel: verification.channel
      };
    } catch (error: any) {
      logger.error('Phone verification failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async checkVerificationCode(phoneNumber: string, code: string) {
    try {
      const verificationCheck = await this.client.verify.v2
        .services(process.env.TWILIO_VERIFY_SERVICE_SID || '')
        .verificationChecks.create({
          to: phoneNumber,
          code
        });

      return {
        status: verificationCheck.status,
        valid: verificationCheck.valid
      };
    } catch (error: any) {
      logger.error('Verification code check failed:', error);
      throw new AppError(error.message, 500);
    }
  }
}
