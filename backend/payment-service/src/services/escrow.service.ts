import { Escrow } from '../models/escrow.model';
import { Payment } from '../models/payment.model';
import { AppError } from '../utils/appError';
import axios from 'axios';

export class EscrowService {
  async createEscrow(escrowData: any) {
    const payment = await Payment.findById(escrowData.paymentId);
    
    if (!payment) {
      throw new AppError('Payment not found', 404);
    }

    const escrow = await Escrow.create({
      payment: payment._id,
      order: escrowData.orderId,
      seller: escrowData.sellerId,
      buyer: escrowData.buyerId,
      amount: payment.amount,
      status: 'held'
    });

    return escrow;
  }

  async releaseEscrow(escrowId: string) {
    const escrow = await Escrow.findById(escrowId);
    
    if (!escrow) {
      throw new AppError('Escrow not found', 404);
    }

    if (escrow.status !== 'held') {
      throw new AppError('Escrow is not in held status', 400);
    }

    escrow.status = 'released';
    escrow.releasedAt = new Date();
    await escrow.save();

    await this.transferFundsToSeller(escrow);

    return escrow;
  }

  async refundEscrow(escrowId: string) {
    const escrow = await Escrow.findById(escrowId);
    
    if (!escrow) {
      throw new AppError('Escrow not found', 404);
    }

    if (escrow.status !== 'held') {
      throw new AppError('Escrow is not in held status', 400);
    }

    escrow.status = 'refunded';
    escrow.refundedAt = new Date();
    await escrow.save();

    await this.refundToBuyer(escrow);

    return escrow;
  }

  async getEscrow(escrowId: string) {
    const escrow = await Escrow.findById(escrowId)
      .populate('payment')
      .populate('order')
      .populate('seller')
      .populate('buyer');
    
    if (!escrow) {
      throw new AppError('Escrow not found', 404);
    }

    return escrow;
  }

  private async transferFundsToSeller(escrow: any) {
    try {
      await axios.post(`${process.env.PAYMENT_PROCESSOR_URL}/transfer`, {
        amount: escrow.amount,
        recipient: escrow.seller,
        reference: escrow._id
      });
    } catch (error) {
      console.error('Error transferring funds:', error);
      throw new AppError('Failed to transfer funds', 500);
    }
  }

  private async refundToBuyer(escrow: any) {
    try {
      await axios.post(`${process.env.PAYMENT_PROCESSOR_URL}/refund`, {
        amount: escrow.amount,
        recipient: escrow.buyer,
        reference: escrow._id
      });
    } catch (error) {
      console.error('Error refunding:', error);
      throw new AppError('Failed to process refund', 500);
    }
  }
}
