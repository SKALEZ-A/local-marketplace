export interface Escrow {
  id: string;
  orderId: string;
  paymentId: string;
  amount: number;
  currency: string;
  status: 'held' | 'released' | 'refunded' | 'disputed';
  holdUntil: Date;
  releasedAt?: Date;
  releaseReason?: string;
  disputeReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EscrowRelease {
  escrowId: string;
  reason: string;
  releasedBy: string;
  timestamp: Date;
}

export interface EscrowDispute {
  escrowId: string;
  reason: string;
  initiatedBy: string;
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  resolution?: string;
  createdAt: Date;
  resolvedAt?: Date;
}

export interface EscrowPolicy {
  defaultHoldDays: number;
  autoReleaseEnabled: boolean;
  disputeWindowDays: number;
  minimumAmount: number;
  maximumAmount: number;
}
