import { Router } from 'express';
import { EscrowController } from '../controllers/escrow.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { escrowValidation } from '../validators/escrow.validator';

const router = Router();
const escrowController = new EscrowController();

// Create escrow
router.post(
  '/',
  authenticate,
  validateRequest(escrowValidation.createEscrow),
  escrowController.createEscrow.bind(escrowController)
);

// Get escrow details
router.get(
  '/:escrowId',
  authenticate,
  escrowController.getEscrow.bind(escrowController)
);

// Release escrow
router.post(
  '/:escrowId/release',
  authenticate,
  escrowController.releaseEscrow.bind(escrowController)
);

// Refund escrow
router.post(
  '/:escrowId/refund',
  authenticate,
  escrowController.refundEscrow.bind(escrowController)
);

// Dispute escrow
router.post(
  '/:escrowId/dispute',
  authenticate,
  validateRequest(escrowValidation.disputeEscrow),
  escrowController.disputeEscrow.bind(escrowController)
);

// Resolve dispute
router.post(
  '/:escrowId/resolve',
  authenticate,
  validateRequest(escrowValidation.resolveDispute),
  escrowController.resolveDispute.bind(escrowController)
);

// List escrows
router.get(
  '/',
  authenticate,
  escrowController.listEscrows.bind(escrowController)
);

export default router;
