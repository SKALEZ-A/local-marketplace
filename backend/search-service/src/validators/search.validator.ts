import { body, query } from 'express-validator';

export const searchValidator = [
  body('query')
    .notEmpty()
    .withMessage('Search query is required')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Search query must be between 1 and 200 characters'),
  
  body('filters')
    .optional()
    .isObject()
    .withMessage('Filters must be an object'),
  
  body('sort')
    .optional()
    .isObject()
    .withMessage('Sort must be an object'),
  
  body('pagination')
    .optional()
    .isObject()
    .withMessage('Pagination must be an object'),
  
  body('pagination.page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be at least 1'),
  
  body('pagination.limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

export const autocompleteValidator = [
  query('query')
    .notEmpty()
    .withMessage('Query is required')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Query must be between 1 and 100 characters')
];

export const popularSearchesValidator = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
];
