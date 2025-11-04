import { Request, Response, NextFunction } from 'express';
import { createClient, RedisClientType } from 'redis';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';

let redisClient: RedisClientType | null = null;

export const initializeRedis = async (): Promise<void> => {
  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });

    await redisClient.connect();
    logger.info('Redis client connected for rate limiting');
  } catch (error) {
    logger.error('Failed to initialize Redis for rate limiting:', error);
  }
};

export interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: Request) => string;
}

export const rateLimitMiddleware = (options: RateLimitOptions) => {
  const {
    windowMs,
    max,
    message = 'Too many requests, please try again later',
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    keyGenerator = defaultKeyGenerator
  } = options;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const key = keyGenerator(req);
      const now = Date.now();

      if (redisClient && redisClient.isOpen) {
        const result = await checkRateLimitRedis(key, windowMs, max, now);

        if (!result.allowed) {
          res.setHeader('X-RateLimit-Limit', max);
          res.setHeader('X-RateLimit-Remaining', 0);
          res.setHeader('X-RateLimit-Reset', result.resetTime);
          res.setHeader('Retry-After', Math.ceil((result.resetTime - now) / 1000));

          logger.warn('Rate limit exceeded', {
            key,
            ip: req.ip,
            path: req.path
          });

          return next(new AppError(message, 429));
        }

        res.setHeader('X-RateLimit-Limit', max);
        res.setHeader('X-RateLimit-Remaining', result.remaining);
        res.setHeader('X-RateLimit-Reset', result.resetTime);
      } else {
        const result = checkRateLimitMemory(key, windowMs, max, now);

        if (!result.allowed) {
          res.setHeader('X-RateLimit-Limit', max);
          res.setHeader('X-RateLimit-Remaining', 0);
          res.setHeader('Retry-After', Math.ceil((result.resetTime - now) / 1000));

          return next(new AppError(message, 429));
        }

        res.setHeader('X-RateLimit-Limit', max);
        res.setHeader('X-RateLimit-Remaining', result.remaining);
      }

      if (skipSuccessfulRequests || skipFailedRequests) {
        const originalSend = res.send;
        res.send = function(data: any) {
          const shouldSkip =
            (skipSuccessfulRequests && res.statusCode < 400) ||
            (skipFailedRequests && res.statusCode >= 400);

          if (shouldSkip && redisClient && redisClient.isOpen) {
            decrementRateLimit(key).catch(err =>
              logger.error('Failed to decrement rate limit:', err)
            );
          }

          return originalSend.call(this, data);
        };
      }

      next();
    } catch (error) {
      logger.error('Rate limit middleware error:', error);
      next();
    }
  };
};

async function checkRateLimitRedis(
  key: string,
  windowMs: number,
  max: number,
  now: number
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  if (!redisClient) {
    throw new Error('Redis client not initialized');
  }

  const rateLimitKey = `ratelimit:${key}`;
  const current = await redisClient.get(rateLimitKey);

  if (!current) {
    await redisClient.setEx(rateLimitKey, Math.ceil(windowMs / 1000), '1');
    return {
      allowed: true,
      remaining: max - 1,
      resetTime: now + windowMs
    };
  }

  const count = parseInt(current, 10);

  if (count >= max) {
    const ttl = await redisClient.ttl(rateLimitKey);
    return {
      allowed: false,
      remaining: 0,
      resetTime: now + ttl * 1000
    };
  }

  await redisClient.incr(rateLimitKey);

  return {
    allowed: true,
    remaining: max - count - 1,
    resetTime: now + (await redisClient.ttl(rateLimitKey)) * 1000
  };
}

const memoryStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimitMemory(
  key: string,
  windowMs: number,
  max: number,
  now: number
): { allowed: boolean; remaining: number; resetTime: number } {
  const record = memoryStore.get(key);

  if (!record || now > record.resetTime) {
    memoryStore.set(key, {
      count: 1,
      resetTime: now + windowMs
    });

    return {
      allowed: true,
      remaining: max - 1,
      resetTime: now + windowMs
    };
  }

  if (record.count >= max) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime
    };
  }

  record.count++;

  return {
    allowed: true,
    remaining: max - record.count,
    resetTime: record.resetTime
  };
}

async function decrementRateLimit(key: string): Promise<void> {
  if (redisClient && redisClient.isOpen) {
    const rateLimitKey = `ratelimit:${key}`;
    await redisClient.decr(rateLimitKey);
  } else {
    const record = memoryStore.get(key);
    if (record && record.count > 0) {
      record.count--;
    }
  }
}

function defaultKeyGenerator(req: Request): string {
  return req.ip || 'unknown';
}

export const createRateLimiter = (options: RateLimitOptions) => {
  return rateLimitMiddleware(options);
};

export const strictRateLimit = rateLimitMiddleware({
  windowMs: 15 * 60 * 1000,
  max: 100
});

export const standardRateLimit = rateLimitMiddleware({
  windowMs: 15 * 60 * 1000,
  max: 1000
});

export const authRateLimit = rateLimitMiddleware({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many authentication attempts, please try again later'
});

export const apiRateLimit = rateLimitMiddleware({
  windowMs: 60 * 1000,
  max: 60
});

export const slowDownMiddleware = (options: {
  windowMs: number;
  delayAfter: number;
  delayMs: number;
  maxDelayMs?: number;
}) => {
  const { windowMs, delayAfter, delayMs, maxDelayMs = 10000 } = options;
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    const record = requests.get(key);

    if (!record || now > record.resetTime) {
      requests.set(key, {
        count: 1,
        resetTime: now + windowMs
      });
      return next();
    }

    record.count++;

    if (record.count > delayAfter) {
      const delay = Math.min((record.count - delayAfter) * delayMs, maxDelayMs);
      
      logger.debug('Slowing down request', {
        key,
        count: record.count,
        delay
      });

      setTimeout(() => next(), delay);
    } else {
      next();
    }
  };
};

export const dynamicRateLimit = (options: {
  baseWindowMs: number;
  baseMax: number;
  getUserTier: (req: Request) => Promise<string>;
  tierMultipliers: Record<string, number>;
}) => {
  const { baseWindowMs, baseMax, getUserTier, tierMultipliers } = options;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tier = await getUserTier(req);
      const multiplier = tierMultipliers[tier] || 1;
      const max = Math.floor(baseMax * multiplier);

      const limiter = rateLimitMiddleware({
        windowMs: baseWindowMs,
        max
      });

      limiter(req, res, next);
    } catch (error) {
      logger.error('Dynamic rate limit error:', error);
      next();
    }
  };
};

export const resetRateLimit = async (key: string): Promise<void> => {
  if (redisClient && redisClient.isOpen) {
    await redisClient.del(`ratelimit:${key}`);
  } else {
    memoryStore.delete(key);
  }
};

export const getRateLimitInfo = async (key: string): Promise<{
  count: number;
  resetTime: number;
} | null> => {
  if (redisClient && redisClient.isOpen) {
    const rateLimitKey = `ratelimit:${key}`;
    const count = await redisClient.get(rateLimitKey);
    const ttl = await redisClient.ttl(rateLimitKey);

    if (count) {
      return {
        count: parseInt(count, 10),
        resetTime: Date.now() + ttl * 1000
      };
    }
  } else {
    const record = memoryStore.get(key);
    if (record) {
      return {
        count: record.count,
        resetTime: record.resetTime
      };
    }
  }

  return null;
};

export const cleanupMemoryStore = (): void => {
  const now = Date.now();
  for (const [key, record] of memoryStore.entries()) {
    if (now > record.resetTime) {
      memoryStore.delete(key);
    }
  }
};

setInterval(cleanupMemoryStore, 60000);

export const closeRedis = async (): Promise<void> => {
  if (redisClient && redisClient.isOpen) {
    await redisClient.quit();
    logger.info('Redis client disconnected');
  }
};
