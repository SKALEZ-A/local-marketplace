export interface WebhookEvent {
  id: string;
  type: string;
  provider: 'stripe' | 'paypal' | 'square' | 'crypto';
  data: any;
  timestamp: Date;
  signature?: string;
}

export interface WebhookPayload {
  event: string;
  data: any;
  timestamp: number;
  signature: string;
}

export interface WebhookResponse {
  success: boolean;
  message: string;
  processed: boolean;
}

export interface WebhookSubscription {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  secret: string;
  createdAt: Date;
}
