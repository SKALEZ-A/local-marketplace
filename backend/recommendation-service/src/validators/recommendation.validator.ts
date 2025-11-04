import { body, param, query } from 'express-validator';

export const getRecommendationsValidator = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
];

export const getSimilarProductsValidator = [
  param('productId')
    .notEmpty()
    .withMessage('Product ID is required'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Limit must be between 1 and 20')
];

export const trackViewValidator = [
  body('productId')
    .notEmpty()
    .withMessage('Product ID is required')
    .isString()
    .withMessage('Product ID must be a string')
];
