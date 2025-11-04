import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';

interface ThrottleOptions {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: Request) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export class ThrottleMiddleware {
  private redis: Redis;
  private options: ThrottleOptions;

  constructor(redis: Redis, options: ThrottleOptions) {
    this.redis = redis;
    this.options = {
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      keyGenerator: (req) => req.ip || 'unknown',
      ...options,
    };
  }

  middleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const key = `throttle:${this.options.keyGenerator!(req)}`;
      const current = await this.redis.incr(key);

      if (current === 1) {
        await this.redis.pexpire(key, this.options.windowMs);
      }

      const ttl = await this.redis.pttl(key);
      
      res.setHeader('X-RateLimit-Limit', this.options.maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, this.options.maxRequests - current));
      res.setHeader('X-RateLimit-Reset', new Date(Date.now() + ttl).toISOString());

      if (current > this.options.maxRequests) {
        throw new AppError('Too many requests', 429);
      }

      next();
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
      } else {
        logger.error('Throttle middleware error:', error);
        next();
      }
    }
  };
}

export const createThrottleMiddleware = (redis: Redis, options: ThrottleOptions) => {
  const throttle = new ThrottleMiddleware(redis, options);
  return throttle.middleware;
};
