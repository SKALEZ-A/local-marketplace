export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  channel: NotificationChannel;
  title?: string;
  content: string;
  data?: Record<string, any>;
  status: NotificationStatus;
  readAt?: Date;
  sentAt?: Date;
  createdAt: Date;
}

export type NotificationType =
  | 'order_confirmation'
  | 'order_shipped'
  | 'order_delivered'
  | 'message_received'
  | 'price_drop'
  | 'product_available'
  | 'review_request'
  | 'payment_received'
  | 'low_stock'
  | 'promotion';

export type NotificationChannel = 'email' | 'sms' | 'push';

export type NotificationStatus = 'pending' | 'sent' | 'failed' | 'read';

export interface NotificationTemplate {
  id: string;
  name: string;
  type: NotificationType;
  channel: NotificationChannel;
  subject?: string;
  template: string;
  variables: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationPreferences {
  id: string;
  userId: string;
  notificationType: NotificationType;
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}
