import { body, param } from 'express-validator';

export const updateInventoryValidator = [
  param('id')
    .notEmpty()
    .withMessage('Product ID is required'),
  
  body('quantity')
    .notEmpty()
    .withMessage('Quantity is required')
    .isInt({ min: 0 })
    .withMessage('Quantity must be a non-negative integer')
];

export const reserveInventoryValidator = [
  param('id')
    .notEmpty()
    .withMessage('Product ID is required'),
  
  body('quantity')
    .notEmpty()
    .withMessage('Quantity is required')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1')
];

export const releaseInventoryValidator = [
  param('id')
    .notEmpty()
    .withMessage('Product ID is required'),
  
  body('quantity')
    .notEmpty()
    .withMessage('Quantity is required')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1')
];
