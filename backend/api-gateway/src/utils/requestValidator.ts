import { Request, Response, NextFunction } from 'express';
import { AppError } from './appError';

export const validateRequestBody = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errors = error.details.map((detail: any) => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      throw new AppError('Validation failed', 400, errors);
    }
    
    next();
  };
};

export const validateRequestQuery = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.query, { abortEarly: false });
    
    if (error) {
      const errors = error.details.map((detail: any) => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      throw new AppError('Validation failed', 400, errors);
    }
    
    next();
  };
};

export const validateRequestParams = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.params, { abortEarly: false });
    
    if (error) {
      const errors = error.details.map((detail: any) => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      throw new AppError('Validation failed', 400, errors);
    }
    
    next();
  };
};
