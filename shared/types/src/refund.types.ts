export interface Refund {
  id: string;
  paymentId: string;
  orderId: string;
  amount: number;
  currency: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'failed';
  requestedBy: string;
  approvedBy?: string;
  transactionId?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface RefundRequest {
  paymentId: string;
  amount: number;
  reason: string;
  items?: {
    productId: string;
    quantity: number;
    amount: number;
  }[];
}

export interface RefundPolicy {
  allowedDays: number;
  partialRefundAllowed: boolean;
  restockingFee: number;
  autoApproveThreshold: number;
  requiresApproval: boolean;
}

export interface RefundReason {
  code: string;
  description: string;
  category: 'product_issue' | 'shipping_issue' | 'customer_change' | 'other';
}
