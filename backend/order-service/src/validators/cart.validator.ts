import { body, param } from 'express-validator';

export const addItemValidator = [
  body('productId')
    .notEmpty()
    .withMessage('Product ID is required')
    .isString()
    .withMessage('Product ID must be a string'),
  
  body('quantity')
    .notEmpty()
    .withMessage('Quantity is required')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  
  body('variantId')
    .optional()
    .isString()
    .withMessage('Variant ID must be a string')
];

export const updateItemValidator = [
  param('productId')
    .notEmpty()
    .withMessage('Product ID is required'),
  
  body('quantity')
    .notEmpty()
    .withMessage('Quantity is required')
    .isInt({ min: 0 })
    .withMessage('Quantity must be a non-negative integer'),
  
  body('variantId')
    .optional()
    .isString()
    .withMessage('Variant ID must be a string')
];

export const removeItemValidator = [
  param('productId')
    .notEmpty()
    .withMessage('Product ID is required')
];

export const mergeCartsValidator = [
  body('guestCartId')
    .notEmpty()
    .withMessage('Guest cart ID is required')
    .isString()
    .withMessage('Guest cart ID must be a string')
];
