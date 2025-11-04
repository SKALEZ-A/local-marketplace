import { body, param } from 'express-validator';

export const trackPageViewValidator = [
  body('page')
    .notEmpty()
    .withMessage('Page is required')
    .isString()
    .withMessage('Page must be a string'),
  
  body('sessionId')
    .notEmpty()
    .withMessage('Session ID is required')
    .isString()
    .withMessage('Session ID must be a string'),
  
  body('referrer')
    .optional()
    .isString()
    .withMessage('Referrer must be a string'),
  
  body('duration')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Duration must be a non-negative integer')
];

export const trackEventValidator = [
  body('eventType')
    .notEmpty()
    .withMessage('Event type is required')
    .isString()
    .withMessage('Event type must be a string'),
  
  body('sessionId')
    .notEmpty()
    .withMessage('Session ID is required')
    .isString()
    .withMessage('Session ID must be a string'),
  
  body('eventData')
    .notEmpty()
    .withMessage('Event data is required')
    .isObject()
    .withMessage('Event data must be an object')
];

export const getUserMetricsValidator = [
  param('userId')
    .notEmpty()
    .withMessage('User ID is required')
];
