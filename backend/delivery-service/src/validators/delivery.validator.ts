import { body, param } from 'express-validator';

export const createDeliveryValidator = [
  body('orderId')
    .notEmpty()
    .withMessage('Order ID is required')
    .isString()
    .withMessage('Order ID must be a string'),
  
  body('carrier')
    .notEmpty()
    .withMessage('Carrier is required')
    .isString()
    .withMessage('Carrier must be a string'),
  
  body('pickupAddress')
    .notEmpty()
    .withMessage('Pickup address is required')
    .isObject()
    .withMessage('Pickup address must be an object'),
  
  body('pickupAddress.street')
    .notEmpty()
    .withMessage('Pickup street is required'),
  
  body('pickupAddress.city')
    .notEmpty()
    .withMessage('Pickup city is required'),
  
  body('pickupAddress.state')
    .notEmpty()
    .withMessage('Pickup state is required'),
  
  body('pickupAddress.zipCode')
    .notEmpty()
    .withMessage('Pickup zip code is required'),
  
  body('pickupAddress.country')
    .notEmpty()
    .withMessage('Pickup country is required'),
  
  body('deliveryAddress')
    .notEmpty()
    .withMessage('Delivery address is required')
    .isObject()
    .withMessage('Delivery address must be an object'),
  
  body('deliveryAddress.street')
    .notEmpty()
    .withMessage('Delivery street is required'),
  
  body('deliveryAddress.city')
    .notEmpty()
    .withMessage('Delivery city is required'),
  
  body('deliveryAddress.state')
    .notEmpty()
    .withMessage('Delivery state is required'),
  
  body('deliveryAddress.zipCode')
    .notEmpty()
    .withMessage('Delivery zip code is required'),
  
  body('deliveryAddress.country')
    .notEmpty()
    .withMessage('Delivery country is required')
];

export const updateDeliveryStatusValidator = [
  param('id')
    .notEmpty()
    .withMessage('Delivery ID is required'),
  
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['pending', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'failed', 'returned'])
    .withMessage('Invalid status'),
  
  body('notes')
    .optional()
    .isString()
    .withMessage('Notes must be a string')
];

export const assignDriverValidator = [
  param('id')
    .notEmpty()
    .withMessage('Delivery ID is required'),
  
  body('driverId')
    .notEmpty()
    .withMessage('Driver ID is required')
    .isString()
    .withMessage('Driver ID must be a string')
];

export const getDeliveryValidator = [
  param('id')
    .notEmpty()
    .withMessage('Delivery ID is required')
];

export const trackDeliveryValidator = [
  param('trackingNumber')
    .notEmpty()
    .withMessage('Tracking number is required')
];
