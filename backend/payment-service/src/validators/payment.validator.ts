import { body, param } from 'express-validator';

export const createPaymentValidator = [
  body('orderId')
    .notEmpty()
    .withMessage('Order ID is required')
    .isString()
    .withMessage('Order ID must be a string'),
  
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
  
  body('provider')
    .notEmpty()
    .withMessage('Payment provider is required')
    .isIn(['stripe', 'paypal', 'square', 'crypto'])
    .withMessage('Invalid payment provider'),
  
  body('paymentMethod')
    .notEmpty()
    .withMessage('Payment method is required')
    .isString()
    .withMessage('Payment method must be a string')
];

export const processPaymentValidator = [
  param('id')
    .notEmpty()
    .withMessage('Payment ID is required'),
  
  body('paymentDetails')
    .notEmpty()
    .withMessage('Payment details are required')
    .isObject()
    .withMessage('Payment details must be an object')
];

export const getPaymentValidator = [
  param('id')
    .notEmpty()
    .withMessage('Payment ID is required')
];
