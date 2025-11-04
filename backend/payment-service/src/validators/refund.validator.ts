import { body, param } from 'express-validator';

export const createRefundValidator = [
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
  
  body('reason')
    .notEmpty()
    .withMessage('Reason is required')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Reason must be between 10 and 500 characters')
];

export const approveRefundValidator = [
  param('id')
    .notEmpty()
    .withMessage('Refund ID is required')
];

export const rejectRefundValidator = [
  param('id')
    .notEmpty()
    .withMessage('Refund ID is required')
];

export const getRefundValidator = [
  param('id')
    .notEmpty()
    .withMessage('Refund ID is required')
];

export const getRefundsByOrderValidator = [
  param('orderId')
    .notEmpty()
    .withMessage('Order ID is required')
];
