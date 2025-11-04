import { body, param } from 'express-validator';

export const sendEmailValidator = [
  body('to')
    .notEmpty()
    .withMessage('Recipient email is required')
    .isEmail()
    .withMessage('Invalid email format'),
  
  body('subject')
    .notEmpty()
    .withMessage('Subject is required')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Subject must be between 1 and 200 characters'),
  
  body('body')
    .notEmpty()
    .withMessage('Email body is required')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Email body cannot be empty'),
  
  body('template')
    .optional()
    .isString()
    .withMessage('Template must be a string')
];

export const sendSMSValidator = [
  body('to')
    .notEmpty()
    .withMessage('Recipient phone number is required')
    .matches(/^\+?[\d\s-()]+$/)
    .withMessage('Invalid phone number format'),
  
  body('message')
    .notEmpty()
    .withMessage('Message is required')
    .trim()
    .isLength({ min: 1, max: 160 })
    .withMessage('Message must be between 1 and 160 characters')
];

export const sendPushValidator = [
  body('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isString()
    .withMessage('User ID must be a string'),
  
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be between 1 and 100 characters'),
  
  body('body')
    .notEmpty()
    .withMessage('Body is required')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Body must be between 1 and 500 characters'),
  
  body('data')
    .optional()
    .isObject()
    .withMessage('Data must be an object')
];

export const markAsReadValidator = [
  param('id')
    .notEmpty()
    .withMessage('Notification ID is required')
];
