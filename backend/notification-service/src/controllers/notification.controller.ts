import { Request, Response, NextFunction } from 'express';
import { EmailService } from '../services/email.service';
import { SMSService } from '../services/sms.service';
import { PushService } from '../services/push.service';
import { logger } from '../utils/logger';

export class NotificationController {
  private emailService: EmailService;
  private smsService: SMSService;
  private pushService: PushService;

  constructor() {
    this.emailService = new EmailService();
    this.smsService = new SMSService();
    this.pushService = new PushService();
  }

  sendEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const emailData = req.body;
      await this.emailService.sendEmail(emailData);

      res.status(200).json({
        success: true,
        message: 'Email sent successfully'
      });
    } catch (error) {
      logger.error('Error sending email:', error);
      next(error);
    }
  };

  sendSMS = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const smsData = req.body;
      await this.smsService.sendSMS(smsData);

      res.status(200).json({
        success: true,
        message: 'SMS sent successfully'
      });
    } catch (error) {
      logger.error('Error sending SMS:', error);
      next(error);
    }
  };

  sendPush = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const pushData = req.body;
      await this.pushService.sendPush(pushData);

      res.status(200).json({
        success: true,
        message: 'Push notification sent successfully'
      });
    } catch (error) {
      logger.error('Error sending push notification:', error);
      next(error);
    }
  };

  getUserNotifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      const notifications = [];

      res.status(200).json({
        success: true,
        data: notifications
      });
    } catch (error) {
      logger.error('Error fetching notifications:', error);
      next(error);
    }
  };

  markAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      res.status(200).json({
        success: true,
        message: 'Notification marked as read'
      });
    } catch (error) {
      logger.error('Error marking notification as read:', error);
      next(error);
    }
  };
}
