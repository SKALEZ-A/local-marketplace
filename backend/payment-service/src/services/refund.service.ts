import { Refund } from '../models/refund.model';
import { Payment } from '../models/payment.model';
import { AppError } from '../utils/appError';
import { StripeService } from './stripe.service';
import { PayPalService } from './paypal.service';

export class RefundService {
  private stripeService: StripeService;
  private paypalService: PayPalService;

  constructor() {
    this.stripeService = new StripeService();
    this.paypalService = new PayPalService();
  }

  async createRefund(refundData: any) {
    const payment = await Payment.findById(refundData.paymentId);
    
    if (!payment) {
      throw new AppError('Payment not found', 404);
    }

    if (payment.status !== 'completed') {
      throw new AppError('Cannot refund incomplete payment', 400);
    }

    const refund = await Refund.create({
      payment: payment._id,
      order: refundData.orderId,
      amount: refundData.amount || payment.amount,
      reason: refundData.reason,
      status: 'pending'
    });

    return refund;
  }

  async processRefund(refundId: string) {
    const refund = await Refund.findById(refundId).populate('payment');
    
    if (!refund) {
      throw new AppError('Refund not found', 404);
    }

    if (refund.status !== 'approved') {
      throw new AppError('Refund must be approved first', 400);
    }

    const payment = refund.payment as any;
    let refundResult;

    switch (payment.provider) {
      case 'stripe':
        refundResult = await this.stripeService.refund(
          payment.transactionId,
          refund.amount
        );
        break;
      case 'paypal':
        refundResult = await this.paypalService.refund(
          payment.transactionId,
          refund.amount
        );
        break;
      default:
        throw new AppError('Unsupported payment provider', 400);
    }

    refund.status = 'completed';
    refund.processedAt = new Date();
    refund.refundTransactionId = refundResult.id;
    await refund.save();

    payment.status = 'refunded';
    await payment.save();

    return refund;
  }

  async approveRefund(refundId: string) {
    const refund = await Refund.findByIdAndUpdate(
      refundId,
      { status: 'approved' },
      { new: true }
    );

    if (!refund) {
      throw new AppError('Refund not found', 404);
    }

    return refund;
  }

  async rejectRefund(refundId: string, reason: string) {
    const refund = await Refund.findByIdAndUpdate(
      refundId,
      { 
        status: 'rejected',
        rejectionReason: reason
      },
      { new: true }
    );

    if (!refund) {
      throw new AppError('Refund not found', 404);
    }

    return refund;
  }

  async getRefunds(options: any = {}) {
    const { page = 1, limit = 20, status } = options;
    const query: any = {};

    if (status) {
      query.status = status;
    }

    const refunds = await Refund.find(query)
      .populate('payment')
      .populate('order')
      .limit(limit)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Refund.countDocuments(query);

    return {
      refunds,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }
}
