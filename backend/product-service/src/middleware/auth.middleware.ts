import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';

export interface IAuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
    sessionId?: string;
  };
}

export const authMiddleware = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req);

    if (!token) {
      throw new AppError('Authentication required', 401);
    }

    const decoded = verifyToken(token);
    req.user = decoded;

    logger.info('User authenticated', {
      userId: decoded.userId,
      role: decoded.role,
      path: req.path
    });

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError('Invalid or expired token', 401));
    }
  }
};

export const optionalAuthMiddleware = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req);

    if (token) {
      const decoded = verifyToken(token);
      req.user = decoded;
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: IAuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn('Unauthorized access attempt', {
        userId: req.user.userId,
        role: req.user.role,
        requiredRoles: allowedRoles,
        path: req.path
      });

      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }

    next();
  };
};

export const requirePermission = (permission: string) => {
  return async (req: IAuthRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    try {
      const hasPermission = await checkUserPermission(req.user.userId, permission);

      if (!hasPermission) {
        logger.warn('Permission denied', {
          userId: req.user.userId,
          permission,
          path: req.path
        });

        return next(
          new AppError('You do not have permission to perform this action', 403)
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export const requireOwnership = (resourceType: string) => {
  return async (req: IAuthRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    // Admin can access everything
    if (req.user.role === 'ADMIN') {
      return next();
    }

    try {
      const resourceId = req.params.productId || req.params.id;
      const isOwner = await checkResourceOwnership(
        req.user.userId,
        resourceType,
        resourceId
      );

      if (!isOwner) {
        logger.warn('Ownership verification failed', {
          userId: req.user.userId,
          resourceType,
          resourceId,
          path: req.path
        });

        return next(
          new AppError('You do not have access to this resource', 403)
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export const apiKeyMiddleware = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      throw new AppError('API key required', 401);
    }

    const decoded = verifyApiKey(apiKey);
    req.user = decoded;

    logger.info('API key authenticated', {
      userId: decoded.userId,
      path: req.path
    });

    next();
  } catch (error) {
    next(new AppError('Invalid or expired API key', 401));
  }
};

export const rateLimitByUser = (maxRequests: number, windowMs: number) => {
  const userRequests = new Map<string, { count: number; resetTime: number }>();

  return (req: IAuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next();
    }

    const userId = req.user.userId;
    const now = Date.now();
    const userLimit = userRequests.get(userId);

    if (!userLimit || now > userLimit.resetTime) {
      userRequests.set(userId, {
        count: 1,
        resetTime: now + windowMs
      });
      return next();
    }

    if (userLimit.count >= maxRequests) {
      const retryAfter = Math.ceil((userLimit.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      return next(new AppError('Too many requests, please try again later', 429));
    }

    userLimit.count++;
    next();
  };
};

// Helper functions
function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check for token in cookies
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }

  // Check for token in query params (not recommended for production)
  if (req.query.token && typeof req.query.token === 'string') {
    return req.query.token;
  }

  return null;
}

function verifyToken(token: string): any {
  const secret = process.env.JWT_ACCESS_SECRET || 'access-secret-key';

  try {
    return jwt.verify(token, secret, {
      issuer: 'marketplace-auth',
      audience: 'marketplace-api'
    });
  } catch (error) {
    throw new AppError('Invalid or expired token', 401);
  }
}

function verifyApiKey(apiKey: string): any {
  const secret = process.env.JWT_ACCESS_SECRET || 'access-secret-key';

  try {
    const decoded = jwt.verify(apiKey, secret, {
      issuer: 'marketplace-auth',
      audience: 'marketplace-api'
    }) as any;

    if (decoded.type !== 'api_key') {
      throw new Error('Invalid API key');
    }

    return {
      userId: decoded.userId,
      email: '',
      role: 'API_USER'
    };
  } catch (error) {
    throw new AppError('Invalid or expired API key', 401);
  }
}

async function checkUserPermission(userId: string, permission: string): Promise<boolean> {
  // This would typically query a permissions database or service
  // For now, return true as a placeholder
  return true;
}

async function checkResourceOwnership(
  userId: string,
  resourceType: string,
  resourceId: string
): Promise<boolean> {
  // This would typically query the resource database to verify ownership
  // For now, return true as a placeholder
  return true;
}

export const verifyWebhookSignature = (secret: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const signature = req.headers['x-webhook-signature'] as string;
    const timestamp = req.headers['x-webhook-timestamp'] as string;

    if (!signature || !timestamp) {
      return next(new AppError('Missing webhook signature or timestamp', 401));
    }

    const payload = JSON.stringify(req.body);
    const expectedSignature = generateWebhookSignature(payload, timestamp, secret);

    if (signature !== expectedSignature) {
      logger.warn('Invalid webhook signature', {
        path: req.path,
        timestamp
      });
      return next(new AppError('Invalid webhook signature', 401));
    }

    // Check timestamp to prevent replay attacks (5 minute window)
    const requestTime = parseInt(timestamp, 10);
    const currentTime = Math.floor(Date.now() / 1000);

    if (Math.abs(currentTime - requestTime) > 300) {
      return next(new AppError('Webhook timestamp too old', 401));
    }

    next();
  };
};

function generateWebhookSignature(payload: string, timestamp: string, secret: string): string {
  const crypto = require('crypto');
  const signaturePayload = `${timestamp}.${payload}`;
  return crypto.createHmac('sha256', secret).update(signaturePayload).digest('hex');
}
