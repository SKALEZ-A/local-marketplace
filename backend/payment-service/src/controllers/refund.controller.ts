import { Request, Response, NextFunction } from 'express';
import { RefundService } from '../services/refund.service';
import { logger } from '../utils/logger';

const refundService = new RefundService();

export class RefundController {
  async createRefund(req: Request, res: Response, next: NextFunction) {
    try {
      const { paymentId, amount, reason } = req.body;
      const userId = req.user.id;

      const refund = await refundService.createRefund({
        paymentId,
        userId,
        amount,
        reason
      });

      res.status(201).json({
        success: true,
        data: refund
      });
    } catch (error) {
      next(error);
    }
  }

  async getRefund(req: Request, res: Response, next: NextFunction) {
    try {
      const { refundId } = req.params;
      const userId = req.user.id;

      const refund = await refundService.getRefund(refundId, userId);

      res.status(200).json({
        success: true,
        data: refund
      });
    } catch (error) {
      next(error);
    }
  }

  async listRefunds(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user.id;
      const { status, page = 1, limit = 20 } = req.query;

      const refunds = await refundService.listRefunds(
        userId,
        status as string,
        Number(page),
        Number(limit)
      );

      res.status(200).json({
        success: true,
        data: refunds
      });
    } catch (error) {
      next(error);
    }
  }

  async cancelRefund(req: Request, res: Response, next: NextFunction) {
    try {
      const { refundId } = req.params;
      const userId = req.user.id;

      await refundService.cancelRefund(refundId, userId);

      res.status(200).json({
        success: true,
        message: 'Refund cancelled successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async processRefund(req: Request, res: Response, next: NextFunction) {
    try {
      const { refundId } = req.params;
      const adminId = req.user.id;

      await refundService.processRefund(refundId, adminId);

      res.status(200).json({
        success: true,
        message: 'Refund processed successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}
