import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';

export const validateRequest = (schema: Joi.ObjectSchema, property: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      logger.warn('Validation error', {
        path: req.path,
        method: req.method,
        errors
      });

      return next(new AppError('Validation failed', 400, errors));
    }

    req[property] = value;
    next();
  };
};

export const validateMultiple = (schemas: {
  body?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
}) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const allErrors: any[] = [];

    if (schemas.body) {
      const { error, value } = schemas.body.validate(req.body, {
        abortEarly: false,
        stripUnknown: true
      });

      if (error) {
        allErrors.push(...error.details.map((detail) => ({
          location: 'body',
          field: detail.path.join('.'),
          message: detail.message
        })));
      } else {
        req.body = value;
      }
    }

    if (schemas.query) {
      const { error, value } = schemas.query.validate(req.query, {
        abortEarly: false,
        stripUnknown: true
      });

      if (error) {
        allErrors.push(...error.details.map((detail) => ({
          location: 'query',
          field: detail.path.join('.'),
          message: detail.message
        })));
      } else {
        req.query = value;
      }
    }

    if (schemas.params) {
      const { error, value } = schemas.params.validate(req.params, {
        abortEarly: false,
        stripUnknown: true
      });

      if (error) {
        allErrors.push(...error.details.map((detail) => ({
          location: 'params',
          field: detail.path.join('.'),
          message: detail.message
        })));
      } else {
        req.params = value;
      }
    }

    if (allErrors.length > 0) {
      logger.warn('Multiple validation errors', {
        path: req.path,
        method: req.method,
        errors: allErrors
      });

      return next(new AppError('Validation failed', 400, allErrors));
    }

    next();
  };
};

export const commonSchemas = {
  id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required().messages({
    'string.pattern.base': 'Invalid ID format'
  }),

  email: Joi.string().email().lowercase().trim().required(),

  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    }),

  phone: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .messages({
      'string.pattern.base': 'Invalid phone number format'
    }),

  url: Joi.string().uri().messages({
    'string.uri': 'Invalid URL format'
  }),

  date: Joi.date().iso(),

  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sort: Joi.string().default('-createdAt'),
    order: Joi.string().valid('asc', 'desc').default('desc')
  }),

  search: Joi.object({
    q: Joi.string().trim().min(1).max(100),
    fields: Joi.array().items(Joi.string())
  }),

  coordinates: Joi.object({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required()
  }),

  address: Joi.object({
    street: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    country: Joi.string().required(),
    postalCode: Joi.string().required(),
    coordinates: Joi.object({
      latitude: Joi.number().min(-90).max(90),
      longitude: Joi.number().min(-180).max(180)
    })
  }),

  price: Joi.number().min(0).precision(2),

  currency: Joi.string().length(3).uppercase().default('USD'),

  status: Joi.string().valid('ACTIVE', 'INACTIVE', 'PENDING', 'SUSPENDED', 'DELETED'),

  tags: Joi.array().items(Joi.string().trim().lowercase()).max(20),

  metadata: Joi.object().pattern(Joi.string(), Joi.any())
};

export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '');
};

export const sanitizeObject = (obj: any): any => {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  const sanitized: any = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      if (typeof value === 'string') {
        sanitized[key] = sanitizeInput(value);
      } else if (typeof value === 'object') {
        sanitized[key] = sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
  }
  return sanitized;
};

export const customValidators = {
  isValidObjectId: (value: string): boolean => {
    return /^[0-9a-fA-F]{24}$/.test(value);
  },

  isValidSlug: (value: string): boolean => {
    return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
  },

  isValidUsername: (value: string): boolean => {
    return /^[a-zA-Z0-9_-]{3,20}$/.test(value);
  },

  isValidHexColor: (value: string): boolean => {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value);
  },

  isValidIPAddress: (value: string): boolean => {
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    return ipv4Regex.test(value) || ipv6Regex.test(value);
  },

  isValidCreditCard: (value: string): boolean => {
    const cleaned = value.replace(/\s/g, '');
    if (!/^\d{13,19}$/.test(cleaned)) return false;

    let sum = 0;
    let isEven = false;

    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned[i], 10);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  },

  isStrongPassword: (value: string): boolean => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumbers = /\d/.test(value);
    const hasSpecialChar = /[@$!%*?&]/.test(value);

    return (
      value.length >= minLength &&
      hasUpperCase &&
      hasLowerCase &&
      hasNumbers &&
      hasSpecialChar
    );
  },

  isValidJSON: (value: string): boolean => {
    try {
      JSON.parse(value);
      return true;
    } catch {
      return false;
    }
  },

  isValidBase64: (value: string): boolean => {
    try {
      return btoa(atob(value)) === value;
    } catch {
      return false;
    }
  },

  isValidSKU: (value: string): boolean => {
    return /^[A-Z0-9-]{6,20}$/.test(value);
  },

  isValidPostalCode: (value: string, country: string = 'US'): boolean => {
    const patterns: Record<string, RegExp> = {
      US: /^\d{5}(-\d{4})?$/,
      UK: /^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i,
      CA: /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i,
      DE: /^\d{5}$/,
      FR: /^\d{5}$/,
      JP: /^\d{3}-\d{4}$/
    };

    const pattern = patterns[country.toUpperCase()];
    return pattern ? pattern.test(value) : true;
  }
};

export const formatValidationErrors = (error: Joi.ValidationError): any[] => {
  return error.details.map((detail) => ({
    field: detail.path.join('.'),
    message: detail.message,
    type: detail.type
  }));
};

export const asyncValidate = (validationFn: Function) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await validationFn(req);
      next();
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
      } else {
        next(new AppError('Validation failed', 400));
      }
    }
  };
};
