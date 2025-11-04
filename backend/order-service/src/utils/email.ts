import axios from 'axios';
import { logger } from './logger';

const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3012';

export const sendOrderConfirmation = async (orderId: string, userEmail: string, orderDetails: any): Promise<void> => {
  try {
    await axios.post(`${NOTIFICATION_SERVICE_URL}/email`, {
      to: userEmail,
      subject: `Order Confirmation - ${orderId}`,
      template: 'order_confirmation',
      data: {
        orderId,
        ...orderDetails
      }
    });
    logger.info(`Order confirmation email sent for order ${orderId}`);
  } catch (error) {
    logger.error('Error sending order confirmation email:', error);
  }
};

export const sendOrderStatusUpdate = async (orderId: string, userEmail: string, status: string): Promise<void> => {
  try {
    await axios.post(`${NOTIFICATION_SERVICE_URL}/email`, {
      to: userEmail,
      subject: `Order Status Update - ${orderId}`,
      template: 'order_status_update',
      data: {
        orderId,
        status
      }
    });
    logger.info(`Order status update email sent for order ${orderId}`);
  } catch (error) {
    logger.error('Error sending order status update email:', error);
  }
};

export const sendOrderCancellation = async (orderId: string, userEmail: string): Promise<void> => {
  try {
    await axios.post(`${NOTIFICATION_SERVICE_URL}/email`, {
      to: userEmail,
      subject: `Order Cancelled - ${orderId}`,
      template: 'order_cancellation',
      data: {
        orderId
      }
    });
    logger.info(`Order cancellation email sent for order ${orderId}`);
  } catch (error) {
    logger.error('Error sending order cancellation email:', error);
  }
};
