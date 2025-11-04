import { Request, Response, NextFunction } from 'express';
import { EscrowService } from '../services/escrow.service';
import { logger } from '../utils/logger';
import { AppError } from '../utils/appError';

const escrowService = new EscrowService();

export class EscrowController {
  async createEscrow(req: Request, res: Response, next: NextFunction) {
    try {
      const { orderId, sellerId, amount, currency, terms } = req.body;
      const buyerId = req.user.id;

      const escrow = await escrowService.createEscrow({
        orderId,
        buyerId,
        sellerId,
        amount,
        currency,
        terms
      });

      res.status(201).json({
        success: true,
        data: escrow
      });
    } catch (error) {
      next(error);
    }
  }

  async getEscrow(req: Request, res: Response, next: NextFunction) {
    try {
      const { escrowId } = req.params;
      const userId = req.user.id;

      const escrow = await escrowService.getEscrow(escrowId, userId);

      res.status(200).json({
        success: true,
        data: escrow
      });
    } catch (error) {
      next(error);
    }
  }

  async releaseEscrow(req: Request, res: Response, next: NextFunction) {
    try {
      const { escrowId } = req.params;
      const userId = req.user.id;

      await escrowService.releaseEscrow(escrowId, userId);

      res.status(200).json({
        success: true,
        message: 'Escrow released successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async refundEscrow(req: Request, res: Response, next: NextFunction) {
    try {
      const { escrowId } = req.params;
      const userId = req.user.id;

      await escrowService.refundEscrow(escrowId, userId);

      res.status(200).json({
        success: true,
        message: 'Escrow refunded successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async disputeEscrow(req: Request, res: Response, next: NextFunction) {
    try {
      const { escrowId } = req.params;
      const { reason, evidence } = req.body;
      const userId = req.user.id;

      await escrowService.disputeEscrow(escrowId, userId, reason, evidence);

      res.status(200).json({
        success: true,
        message: 'Dispute filed successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async resolveDispute(req: Request, res: Response, next: NextFunction) {
    try {
      const { escrowId } = req.params;
      const { resolution, winner } = req.body;
      const adminId = req.user.id;

      await escrowService.resolveDispute(escrowId, adminId, resolution, winner);

      res.status(200).json({
        success: true,
        message: 'Dispute resolved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async listEscrows(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user.id;
      const { status, page = 1, limit = 20 } = req.query;

      const escrows = await escrowService.listEscrows(
        userId,
        status as string,
        Number(page),
        Number(limit)
      );

      res.status(200).json({
        success: true,
        data: escrows
      });
    } catch (error) {
      next(error);
    }
  }
}
