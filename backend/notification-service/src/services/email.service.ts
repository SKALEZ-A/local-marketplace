import nodemailer, { Transporter } from 'nodemailer';
import handlebars from 'handlebars';
import fs from 'fs/promises';
import path from 'path';
import { logger } from '../utils/logger';
import { AppError } from '../utils/appError';

export class EmailService {
  private transporter: Transporter;
  private templateCache: Map<string, HandlebarsTemplateDelegate>;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    this.templateCache = new Map();
  }

  async sendEmail(to: string | string[], subject: string, html: string, text?: string) {
    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@marketplace.com',
        to: Array.isArray(to) ? to.join(', ') : to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, '')
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent: ${info.messageId}`);

      return {
        messageId: info.messageId,
        accepted: info.accepted,
        rejected: info.rejected
      };
    } catch (error: any) {
      logger.error('Email sending failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async sendTemplateEmail(
    to: string | string[],
    subject: string,
    templateName: string,
    data: any
  ) {
    try {
      const template = await this.getTemplate(templateName);
      const html = template(data);

      return await this.sendEmail(to, subject, html);
    } catch (error: any) {
      logger.error('Template email sending failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async sendWelcomeEmail(to: string, name: string) {
    return await this.sendTemplateEmail(
      to,
      'Welcome to Smart Local Marketplace',
      'welcome',
      { name, year: new Date().getFullYear() }
    );
  }

  async sendOrderConfirmation(to: string, orderData: any) {
    return await this.sendTemplateEmail(
      to,
      `Order Confirmation - #${orderData.orderNumber}`,
      'order-confirmation',
      orderData
    );
  }

  async sendOrderShipped(to: string, orderData: any) {
    return await this.sendTemplateEmail(
      to,
      `Your Order Has Shipped - #${orderData.orderNumber}`,
      'order-shipped',
      orderData
    );
  }

  async sendOrderDelivered(to: string, orderData: any) {
    return await this.sendTemplateEmail(
      to,
      `Your Order Has Been Delivered - #${orderData.orderNumber}`,
      'order-delivered',
      orderData
    );
  }

  async sendPasswordReset(to: string, resetToken: string, name: string) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    return await this.sendTemplateEmail(
      to,
      'Password Reset Request',
      'password-reset',
      { name, resetUrl, expiryHours: 24 }
    );
  }

  async sendEmailVerification(to: string, verificationToken: string, name: string) {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    return await this.sendTemplateEmail(
      to,
      'Verify Your Email Address',
      'email-verification',
      { name, verificationUrl }
    );
  }

  async sendPaymentReceipt(to: string, paymentData: any) {
    return await this.sendTemplateEmail(
      to,
      `Payment Receipt - ${paymentData.transactionId}`,
      'payment-receipt',
      paymentData
    );
  }

  async sendRefundNotification(to: string, refundData: any) {
    return await this.sendTemplateEmail(
      to,
      `Refund Processed - ${refundData.refundId}`,
      'refund-notification',
      refundData
    );
  }

  async sendNewMessageNotification(to: string, messageData: any) {
    return await this.sendTemplateEmail(
      to,
      'You Have a New Message',
      'new-message',
      messageData
    );
  }

  async sendReviewRequest(to: string, orderData: any) {
    const reviewUrl = `${process.env.FRONTEND_URL}/orders/${orderData.orderId}/review`;
    return await this.sendTemplateEmail(
      to,
      'How Was Your Experience?',
      'review-request',
      { ...orderData, reviewUrl }
    );
  }

  async sendPriceDropAlert(to: string, productData: any) {
    return await this.sendTemplateEmail(
      to,
      `Price Drop Alert: ${productData.productName}`,
      'price-drop',
      productData
    );
  }

  async sendBackInStockAlert(to: string, productData: any) {
    return await this.sendTemplateEmail(
      to,
      `Back in Stock: ${productData.productName}`,
      'back-in-stock',
      productData
    );
  }

  async sendNewsletter(to: string[], subject: string, content: any) {
    return await this.sendTemplateEmail(
      to,
      subject,
      'newsletter',
      content
    );
  }

  async sendPromotionalEmail(to: string[], subject: string, promotionData: any) {
    return await this.sendTemplateEmail(
      to,
      subject,
      'promotional',
      promotionData
    );
  }

  async sendAccountSuspension(to: string, reason: string, name: string) {
    return await this.sendTemplateEmail(
      to,
      'Account Suspension Notice',
      'account-suspension',
      { name, reason }
    );
  }

  async sendSellerApplicationApproved(to: string, sellerData: any) {
    return await this.sendTemplateEmail(
      to,
      'Your Seller Application Has Been Approved',
      'seller-approved',
      sellerData
    );
  }

  async sendSellerApplicationRejected(to: string, reason: string, name: string) {
    return await this.sendTemplateEmail(
      to,
      'Seller Application Update',
      'seller-rejected',
      { name, reason }
    );
  }

  async sendLowStockAlert(to: string, productData: any) {
    return await this.sendTemplateEmail(
      to,
      `Low Stock Alert: ${productData.productName}`,
      'low-stock-alert',
      productData
    );
  }

  async sendMonthlyReport(to: string, reportData: any) {
    return await this.sendTemplateEmail(
      to,
      `Monthly Sales Report - ${reportData.month}`,
      'monthly-report',
      reportData
    );
  }

  async sendBulkEmail(recipients: string[], subject: string, templateName: string, data: any) {
    const results = [];
    
    for (const recipient of recipients) {
      try {
        const result = await this.sendTemplateEmail(recipient, subject, templateName, data);
        results.push({ email: recipient, success: true, messageId: result.messageId });
      } catch (error: any) {
        results.push({ email: recipient, success: false, error: error.message });
      }
    }

    return results;
  }

  private async getTemplate(templateName: string): Promise<HandlebarsTemplateDelegate> {
    if (this.templateCache.has(templateName)) {
      return this.templateCache.get(templateName)!;
    }

    try {
      const templatePath = path.join(__dirname, '../templates', `${templateName}.hbs`);
      const templateContent = await fs.readFile(templatePath, 'utf-8');
      const template = handlebars.compile(templateContent);
      
      this.templateCache.set(templateName, template);
      return template;
    } catch (error: any) {
      logger.error(`Template loading failed for ${templateName}:`, error);
      throw new AppError(`Template ${templateName} not found`, 404);
    }
  }

  async verifyConnection() {
    try {
      await this.transporter.verify();
      logger.info('Email service connection verified');
      return true;
    } catch (error: any) {
      logger.error('Email service connection failed:', error);
      return false;
    }
  }
}
