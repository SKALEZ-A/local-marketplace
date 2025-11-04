export interface Escrow {
  id: string;
  orderId: string;
  paymentId: string;
  amount: number;
  currency: string;
  status: 'held' | 'released' | 'refunded' | 'disputed';
  holdUntil: Date;
  releasedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class EscrowModel {
  private escrows: Map<string, Escrow> = new Map();

  async findById(id: string): Promise<Escrow | null> {
    return this.escrows.get(id) || null;
  }

  async findByOrderId(orderId: string): Promise<Escrow | null> {
    for (const escrow of this.escrows.values()) {
      if (escrow.orderId === orderId) {
        return escrow;
      }
    }
    return null;
  }

  async findByPaymentId(paymentId: string): Promise<Escrow | null> {
    for (const escrow of this.escrows.values()) {
      if (escrow.paymentId === paymentId) {
        return escrow;
      }
    }
    return null;
  }

  async create(escrowData: Omit<Escrow, 'id' | 'createdAt' | 'updatedAt'>): Promise<Escrow> {
    const id = this.generateId();
    const escrow: Escrow = {
      id,
      ...escrowData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.escrows.set(id, escrow);
    return escrow;
  }

  async update(id: string, escrowData: Partial<Escrow>): Promise<Escrow> {
    const escrow = this.escrows.get(id);
    if (!escrow) {
      throw new Error('Escrow not found');
    }
    const updatedEscrow = { ...escrow, ...escrowData, updatedAt: new Date() };
    this.escrows.set(id, updatedEscrow);
    return updatedEscrow;
  }

  async findExpired(): Promise<Escrow[]> {
    const now = new Date();
    return Array.from(this.escrows.values()).filter(
      e => e.status === 'held' && e.holdUntil < now
    );
  }

  private generateId(): string {
    return `esc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
