import { body, param } from 'express-validator';

export const createChatValidator = [
  body('participants')
    .notEmpty()
    .withMessage('Participants are required')
    .isArray({ min: 1 })
    .withMessage('Participants must be an array with at least one participant'),
  
  body('type')
    .notEmpty()
    .withMessage('Chat type is required')
    .isIn(['direct', 'group', 'support'])
    .withMessage('Invalid chat type'),
  
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Chat name must be between 1 and 100 characters')
];

export const sendMessageValidator = [
  param('chatId')
    .notEmpty()
    .withMessage('Chat ID is required'),
  
  body('content')
    .notEmpty()
    .withMessage('Message content is required')
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Message content must be between 1 and 5000 characters'),
  
  body('type')
    .optional()
    .isIn(['text', 'image', 'file', 'system'])
    .withMessage('Invalid message type'),
  
  body('metadata')
    .optional()
    .isObject()
    .withMessage('Metadata must be an object')
];

export const getChatMessagesValidator = [
  param('chatId')
    .notEmpty()
    .withMessage('Chat ID is required')
];
