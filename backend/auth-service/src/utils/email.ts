import nodemailer from 'nodemailer';
import logger from './logger';

interface EmailOptions {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const emailTemplates: Record<string, (data: any) => string> = {
  'email-verification': (data) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Welcome to Smart Local Marketplace!</h2>
      <p>Hi ${data.firstName},</p>
      <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
      <a href="${data.verificationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">
        Verify Email
      </a>
      <p>Or copy and paste this link into your browser:</p>
      <p style="color: #6B7280; word-break: break-all;">${data.verificationUrl}</p>
      <p>This link will expire in 24 hours.</p>
      <p>If you didn't create an account, please ignore this email.</p>
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #E5E7EB;">
      <p style="color: #6B7280; font-size: 12px;">Smart Local Marketplace Team</p>
    </div>
  `,
  'password-reset': (data) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Password Reset Request</h2>
      <p>Hi ${data.firstName},</p>
      <p>We received a request to reset your password. Click the button below to create a new password:</p>
      <a href="${data.resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">
        Reset Password
      </a>
      <p>Or copy and paste this link into your browser:</p>
      <p style="color: #6B7280; word-break: break-all;">${data.resetUrl}</p>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #E5E7EB;">
      <p style="color: #6B7280; font-size: 12px;">Smart Local Marketplace Team</p>
    </div>
  `,
  'login-notification': (data) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>New Login Detected</h2>
      <p>Hi ${data.firstName},</p>
      <p>We detected a new login to your account:</p>
      <ul style="list-style: none; padding: 0;">
        <li><strong>Time:</strong> ${new Date(data.loginTime).toLocaleString()}</li>
        <li><strong>IP Address:</strong> ${data.ipAddress}</li>
      </ul>
      <p>If this was you, you can safely ignore this email.</p>
      <p>If you don't recognize this activity, please secure your account immediately by changing your password.</p>
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #E5E7EB;">
      <p style="color: #6B7280; font-size: 12px;">Smart Local Marketplace Team</p>
    </div>
  `
};

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    const htmlContent = emailTemplates[options.template]?.(options.data) || '';

    await transporter.sendMail({
      from: `"Smart Local Marketplace" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: options.to,
      subject: options.subject,
      html: htmlContent
    });

    logger.info(`Email sent to ${options.to}: ${options.subject}`);
  } catch (error) {
    logger.error('Failed to send email:', error);
    throw error;
  }
};
