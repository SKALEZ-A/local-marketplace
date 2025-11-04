import { PaymentStatus } from './common.types';

export interface Transaction {
  id: string;
  orderId: string;
  userId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  paymentGateway: string;
  gatewayTransactionId?: string;
  status: PaymentStatus;
  escrowStatus?: EscrowStatus;
  escrowReleaseDate?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export type EscrowStatus = 'held' | 'released' | 'refunded';

export interface Refund {
  id: string;
  transactionId: string;
  amount: number;
  reason: string;
  status: RefundStatus;
  processedAt?: Date;
  createdAt: Date;
}

export type RefundStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface PaymentMethod {
  id: string;
  userId: string;
  type: PaymentMethodType;
  provider: string;
  token: string;
  lastFour?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  createdAt: Date;
}

export type PaymentMethodType = 'card' | 'bank_account' | 'paypal' | 'crypto' | 'wallet';

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  clientSecret: string;
  status: string;
}

export interface InstallmentPlan {
  id: string;
  transactionId: string;
  totalAmount: number;
  installments: number;
  installmentAmount: number;
  frequency: 'weekly' | 'biweekly' | 'monthly';
  schedule: InstallmentSchedule[];
  status: string;
  createdAt: Date;
}

export interface InstallmentSchedule {
  installmentNumber: number;
  amount: number;
  dueDate: Date;
  paidAt?: Date;
  status: 'pending' | 'paid' | 'failed' | 'skipped';
}

export interface CryptoPayment {
  id: string;
  orderId: string;
  cryptocurrency: 'ETH' | 'BTC' | 'USDT' | 'MATIC';
  amount: number;
  walletAddress: string;
  transactionHash?: string;
  confirmations: number;
  status: 'pending' | 'confirming' | 'confirmed' | 'failed';
  createdAt: Date;
}
