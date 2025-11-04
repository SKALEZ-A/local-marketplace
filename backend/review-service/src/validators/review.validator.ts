import { body, param } from 'express-validator';

export const createReviewValidator = [
  body('productId')
    .notEmpty()
    .withMessage('Product ID is required')
    .isString()
    .withMessage('Product ID must be a string'),
  
  body('orderId')
    .notEmpty()
    .withMessage('Order ID is required')
    .isString()
    .withMessage('Order ID must be a string'),
  
  body('rating')
    .notEmpty()
    .withMessage('Rating is required')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Title must be between 5 and 100 characters'),
  
  body('comment')
    .notEmpty()
    .withMessage('Comment is required')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Comment must be between 10 and 1000 characters'),
  
  body('images')
    .optional()
    .isArray()
    .withMessage('Images must be an array')
];

export const getReviewValidator = [
  param('id')
    .notEmpty()
    .withMessage('Review ID is required')
];

export const getProductReviewsValidator = [
  param('productId')
    .notEmpty()
    .withMessage('Product ID is required')
];
