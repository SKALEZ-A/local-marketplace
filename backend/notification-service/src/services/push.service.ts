import admin from 'firebase-admin';
import * as OneSignal from 'onesignal-node';
import { logger } from '../utils/logger';
import { AppError } from '../utils/appError';

export class PushNotificationService {
  private fcm: admin.messaging.Messaging;
  private oneSignalClient: OneSignal.Client;

  constructor() {
    // Initialize Firebase Admin
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
        })
      });
    }
    this.fcm = admin.messaging();

    // Initialize OneSignal
    this.oneSignalClient = new OneSignal.Client(
      process.env.ONESIGNAL_APP_ID || '',
      process.env.ONESIGNAL_API_KEY || ''
    });
  }

  async sendFCMNotification(
    token: string | string[],
    title: string,
    body: string,
    data?: any,
    imageUrl?: string
  ) {
    try {
      const message: admin.messaging.Message = {
        notification: {
          title,
          body,
          imageUrl
        },
        data: data || {},
        token: Array.isArray(token) ? token[0] : token
      };

      if (Array.isArray(token) && token.length > 1) {
        const multicastMessage: admin.messaging.MulticastMessage = {
          notification: {
            title,
            body,
            imageUrl
          },
          data: data || {},
          tokens: token
        };

        const response = await this.fcm.sendMulticast(multicastMessage);
        logger.info(`FCM multicast sent: ${response.successCount} successful, ${response.failureCount} failed`);

        return {
          successCount: response.successCount,
          failureCount: response.failureCount,
          responses: response.responses
        };
      }

      const response = await this.fcm.send(message);
      logger.info(`FCM notification sent: ${response}`);

      return {
        messageId: response,
        success: true
      };
    } catch (error: any) {
      logger.error('FCM notification sending failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async sendOneSignalNotification(
    playerIds: string[],
    title: string,
    body: string,
    data?: any,
    imageUrl?: string
  ) {
    try {
      const notification = {
        contents: { en: body },
        headings: { en: title },
        include_player_ids: playerIds,
        data: data || {},
        big_picture: imageUrl,
        ios_attachments: imageUrl ? { id: imageUrl } : undefined
      };

      const response = await this.oneSignalClient.createNotification(notification);
      logger.info(`OneSignal notification sent: ${response.body.id}`);

      return {
        notificationId: response.body.id,
        recipients: response.body.recipients
      };
    } catch (error: any) {
      logger.error('OneSignal notification sending failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async sendToTopic(topic: string, title: string, body: string, data?: any) {
    try {
      const message: admin.messaging.Message = {
        notification: {
          title,
          body
        },
        data: data || {},
        topic
      };

      const response = await this.fcm.send(message);
      logger.info(`Topic notification sent to ${topic}: ${response}`);

      return {
        messageId: response,
        topic
      };
    } catch (error: any) {
      logger.error('Topic notification sending failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async sendOrderNotification(token: string | string[], orderData: any) {
    return await this.sendFCMNotification(
      token,
      'Order Update',
      `Your order #${orderData.orderNumber} has been ${orderData.status}`,
      { type: 'order', orderId: orderData.orderId, status: orderData.status }
    );
  }

  async sendPaymentNotification(token: string | string[], paymentData: any) {
    return await this.sendFCMNotification(
      token,
      'Payment Confirmation',
      `Payment of ${paymentData.currency} ${paymentData.amount} processed successfully`,
      { type: 'payment', paymentId: paymentData.paymentId }
    );
  }

  async sendMessageNotification(token: string | string[], messageData: any) {
    return await this.sendFCMNotification(
      token,
      `New message from ${messageData.senderName}`,
      messageData.preview,
      { type: 'message', conversationId: messageData.conversationId }
    );
  }

  async sendPriceDropNotification(token: string | string[], productData: any) {
    return await this.sendFCMNotification(
      token,
      'Price Drop Alert!',
      `${productData.productName} is now ${productData.currency} ${productData.newPrice}`,
      { type: 'price_drop', productId: productData.productId },
      productData.imageUrl
    );
  }

  async sendBackInStockNotification(token: string | string[], productData: any) {
    return await this.sendFCMNotification(
      token,
      'Back in Stock!',
      `${productData.productName} is now available`,
      { type: 'back_in_stock', productId: productData.productId },
      productData.imageUrl
    );
  }

  async sendDeliveryNotification(token: string | string[], deliveryData: any) {
    return await this.sendFCMNotification(
      token,
      'Delivery Update',
      deliveryData.message,
      { type: 'delivery', orderId: deliveryData.orderId, status: deliveryData.status }
    );
  }

  async sendPromotionalNotification(tokens: string[], promotionData: any) {
    return await this.sendFCMNotification(
      tokens,
      promotionData.title,
      promotionData.message,
      { type: 'promotion', promotionId: promotionData.promotionId },
      promotionData.imageUrl
    );
  }

  async sendReviewRequestNotification(token: string | string[], orderData: any) {
    return await this.sendFCMNotification(
      token,
      'How was your experience?',
      `Please review your recent order #${orderData.orderNumber}`,
      { type: 'review_request', orderId: orderData.orderId }
    );
  }

  async sendWishlistNotification(token: string | string[], productData: any) {
    return await this.sendFCMNotification(
      token,
      'Wishlist Item Update',
      `${productData.productName} from your wishlist is ${productData.updateType}`,
      { type: 'wishlist', productId: productData.productId }
    );
  }

  async sendSecurityAlert(token: string | string[], alertData: any) {
    return await this.sendFCMNotification(
      token,
      'Security Alert',
      alertData.message,
      { type: 'security', alertType: alertData.alertType },
      undefined
    );
  }

  async sendSubscriptionNotification(token: string | string[], subscriptionData: any) {
    return await this.sendFCMNotification(
      token,
      'Subscription Update',
      subscriptionData.message,
      { type: 'subscription', subscriptionId: subscriptionData.subscriptionId }
    );
  }

  async sendLiveEventNotification(topic: string, eventData: any) {
    return await this.sendToTopic(
      topic,
      'Live Event Starting!',
      `${eventData.eventName} is starting now`,
      { type: 'live_event', eventId: eventData.eventId }
    );
  }

  async subscribeToTopic(tokens: string[], topic: string) {
    try {
      const response = await this.fcm.subscribeToTopic(tokens, topic);
      logger.info(`Subscribed ${tokens.length} tokens to topic ${topic}`);

      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
        errors: response.errors
      };
    } catch (error: any) {
      logger.error('Topic subscription failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async unsubscribeFromTopic(tokens: string[], topic: string) {
    try {
      const response = await this.fcm.unsubscribeFromTopic(tokens, topic);
      logger.info(`Unsubscribed ${tokens.length} tokens from topic ${topic}`);

      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
        errors: response.errors
      };
    } catch (error: any) {
      logger.error('Topic unsubscription failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async sendScheduledNotification(
    token: string | string[],
    title: string,
    body: string,
    scheduledTime: Date,
    data?: any
  ) {
    try {
      // For OneSignal scheduled notifications
      const notification = {
        contents: { en: body },
        headings: { en: title },
        include_player_ids: Array.isArray(token) ? token : [token],
        data: data || {},
        send_after: scheduledTime.toISOString()
      };

      const response = await this.oneSignalClient.createNotification(notification);
      logger.info(`Scheduled notification created: ${response.body.id}`);

      return {
        notificationId: response.body.id,
        scheduledFor: scheduledTime
      };
    } catch (error: any) {
      logger.error('Scheduled notification creation failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async cancelScheduledNotification(notificationId: string) {
    try {
      await this.oneSignalClient.cancelNotification(notificationId);
      logger.info(`Cancelled scheduled notification: ${notificationId}`);

      return { success: true };
    } catch (error: any) {
      logger.error('Notification cancellation failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async sendSilentNotification(token: string | string[], data: any) {
    try {
      const message: admin.messaging.Message = {
        data,
        token: Array.isArray(token) ? token[0] : token,
        apns: {
          payload: {
            aps: {
              contentAvailable: true
            }
          }
        },
        android: {
          priority: 'high'
        }
      };

      const response = await this.fcm.send(message);
      logger.info(`Silent notification sent: ${response}`);

      return {
        messageId: response,
        success: true
      };
    } catch (error: any) {
      logger.error('Silent notification sending failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async getNotificationStats(notificationId: string) {
    try {
      const notification = await this.oneSignalClient.viewNotification(notificationId);

      return {
        id: notification.body.id,
        successful: notification.body.successful,
        failed: notification.body.failed,
        converted: notification.body.converted,
        remaining: notification.body.remaining
      };
    } catch (error: any) {
      logger.error('Notification stats retrieval failed:', error);
      throw new AppError(error.message, 500);
    }
  }
}
