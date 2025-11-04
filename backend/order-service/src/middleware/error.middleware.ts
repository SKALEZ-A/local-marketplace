import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';

export const errorMiddleware = (
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (error instanceof AppError) {
    logger.error(`AppError: ${error.message}`, {
      statusCode: error.statusCode,
      path: req.path,
      method: req.method
    });

    res.status(error.statusCode).json({
      success: false,
      message: error.message
    });
    return;
  }

  logger.error('Unexpected error:', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method
  });

  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
};
