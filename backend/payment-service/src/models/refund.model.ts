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
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export class RefundModel {
  private refunds: Map<string, Refund> = new Map();

  async findById(id: string): Promise<Refund | null> {
    return this.refunds.get(id) || null;
  }

  async findByPaymentId(paymentId: string): Promise<Refund[]> {
    return Array.from(this.refunds.values()).filter(r => r.paymentId === paymentId);
  }

  async findByOrderId(orderId: string): Promise<Refund[]> {
    return Array.from(this.refunds.values()).filter(r => r.orderId === orderId);
  }

  async create(refundData: Omit<Refund, 'id' | 'createdAt' | 'updatedAt'>): Promise<Refund> {
    const id = this.generateId();
    const refund: Refund = {
      id,
      ...refundData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.refunds.set(id, refund);
    return refund;
  }

  async update(id: string, refundData: Partial<Refund>): Promise<Refund> {
    const refund = this.refunds.get(id);
    if (!refund) {
      throw new Error('Refund not found');
    }
    const updatedRefund = { ...refund, ...refundData, updatedAt: new Date() };
    this.refunds.set(id, updatedRefund);
    return updatedRefund;
  }

  private generateId(): string {
    return `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
