import { body, param } from 'express-validator';

export const createEscrowValidator = [
  body('orderId')
    .notEmpty()
    .withMessage('Order ID is required')
    .isString()
    .withMessage('Order ID must be a string'),
  
  body('paymentId')
    .notEmpty()
    .withMessage('Payment ID is required')
    .isString()
    .withMessage('Payment ID must be a string'),
  
  body('amount')
    .notEmpty()
    .withMessage('Amount is required')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  
  body('currency')
    .notEmpty()
    .withMessage('Currency is required')
    .isString()
    .isLength({ min: 3, max: 3 })
    .withMessage('Currency must be a 3-letter code'),
  
  body('holdDays')
    .optional()
    .isInt({ min: 1, max: 30 })
    .withMessage('Hold days must be between 1 and 30')
];

export const releaseEscrowValidator = [
  param('id')
    .notEmpty()
    .withMessage('Escrow ID is required')
];

export const refundEscrowValidator = [
  param('id')
    .notEmpty()
    .withMessage('Escrow ID is required')
];

export const getEscrowValidator = [
  param('id')
    .notEmpty()
    .withMessage('Escrow ID is required')
];
