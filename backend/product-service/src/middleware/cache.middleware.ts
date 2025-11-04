import { Request, Response, NextFunction } from 'express';
import { createClient, RedisClientType } from 'redis';
import { logger } from '../utils/logger';

let redisClient: RedisClientType | null = null;

export const initializeRedis = async (): Promise<void> => {
  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logger.error('Redis reconnection failed after 10 attempts');
            return new Error('Redis reconnection failed');
          }
          return retries * 100;
        }
      }
    });

    redisClient.on('error', (err) => {
      logger.error('Redis client error:', err);
    });

    redisClient.on('connect', () => {
      logger.info('Redis client connected');
    });

    await redisClient.connect();
  } catch (error) {
    logger.error('Failed to initialize Redis:', error);
  }
};

export const cacheMiddleware = (ttl: number = 300) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!redisClient || !redisClient.isOpen) {
      return next();
    }

    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = generateCacheKey(req);

    try {
      const cachedData = await redisClient.get(cacheKey);

      if (cachedData) {
        logger.debug('Cache hit', { key: cacheKey });
        res.setHeader('X-Cache', 'HIT');
        return res.json(JSON.parse(cachedData));
      }

      logger.debug('Cache miss', { key: cacheKey });
      res.setHeader('X-Cache', 'MISS');

      // Store original json method
      const originalJson = res.json.bind(res);

      // Override json method to cache response
      res.json = function(data: any) {
        if (res.statusCode === 200) {
          redisClient!.setEx(cacheKey, ttl, JSON.stringify(data)).catch((err) => {
            logger.error('Failed to cache response:', err);
          });
        }
        return originalJson(data);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error:', error);
      next();
    }
  };
};

export const invalidateCache = async (pattern: string): Promise<void> => {
  if (!redisClient || !redisClient.isOpen) {
    return;
  }

  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
      logger.info('Cache invalidated', { pattern, count: keys.length });
    }
  } catch (error) {
    logger.error('Failed to invalidate cache:', error);
  }
};

export const invalidateCacheByKey = async (key: string): Promise<void> => {
  if (!redisClient || !redisClient.isOpen) {
    return;
  }

  try {
    await redisClient.del(key);
    logger.info('Cache key invalidated', { key });
  } catch (error) {
    logger.error('Failed to invalidate cache key:', error);
  }
};

export const getCachedData = async <T>(key: string): Promise<T | null> => {
  if (!redisClient || !redisClient.isOpen) {
    return null;
  }

  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    logger.error('Failed to get cached data:', error);
    return null;
  }
};

export const setCachedData = async (
  key: string,
  data: any,
  ttl: number = 300
): Promise<void> => {
  if (!redisClient || !redisClient.isOpen) {
    return;
  }

  try {
    await redisClient.setEx(key, ttl, JSON.stringify(data));
  } catch (error) {
    logger.error('Failed to set cached data:', error);
  }
};

export const cacheExists = async (key: string): Promise<boolean> => {
  if (!redisClient || !redisClient.isOpen) {
    return false;
  }

  try {
    const exists = await redisClient.exists(key);
    return exists === 1;
  } catch (error) {
    logger.error('Failed to check cache existence:', error);
    return false;
  }
};

export const incrementCounter = async (key: string, ttl?: number): Promise<number> => {
  if (!redisClient || !redisClient.isOpen) {
    return 0;
  }

  try {
    const count = await redisClient.incr(key);
    if (ttl && count === 1) {
      await redisClient.expire(key, ttl);
    }
    return count;
  } catch (error) {
    logger.error('Failed to increment counter:', error);
    return 0;
  }
};

export const decrementCounter = async (key: string): Promise<number> => {
  if (!redisClient || !redisClient.isOpen) {
    return 0;
  }

  try {
    return await redisClient.decr(key);
  } catch (error) {
    logger.error('Failed to decrement counter:', error);
    return 0;
  }
};

export const addToSet = async (key: string, value: string, ttl?: number): Promise<void> => {
  if (!redisClient || !redisClient.isOpen) {
    return;
  }

  try {
    await redisClient.sAdd(key, value);
    if (ttl) {
      await redisClient.expire(key, ttl);
    }
  } catch (error) {
    logger.error('Failed to add to set:', error);
  }
};

export const removeFromSet = async (key: string, value: string): Promise<void> => {
  if (!redisClient || !redisClient.isOpen) {
    return;
  }

  try {
    await redisClient.sRem(key, value);
  } catch (error) {
    logger.error('Failed to remove from set:', error);
  }
};

export const isInSet = async (key: string, value: string): Promise<boolean> => {
  if (!redisClient || !redisClient.isOpen) {
    return false;
  }

  try {
    return await redisClient.sIsMember(key, value);
  } catch (error) {
    logger.error('Failed to check set membership:', error);
    return false;
  }
};

export const getSetMembers = async (key: string): Promise<string[]> => {
  if (!redisClient || !redisClient.isOpen) {
    return [];
  }

  try {
    return await redisClient.sMembers(key);
  } catch (error) {
    logger.error('Failed to get set members:', error);
    return [];
  }
};

export const addToSortedSet = async (
  key: string,
  score: number,
  value: string,
  ttl?: number
): Promise<void> => {
  if (!redisClient || !redisClient.isOpen) {
    return;
  }

  try {
    await redisClient.zAdd(key, { score, value });
    if (ttl) {
      await redisClient.expire(key, ttl);
    }
  } catch (error) {
    logger.error('Failed to add to sorted set:', error);
  }
};

export const getSortedSetRange = async (
  key: string,
  start: number = 0,
  stop: number = -1,
  reverse: boolean = false
): Promise<string[]> => {
  if (!redisClient || !redisClient.isOpen) {
    return [];
  }

  try {
    if (reverse) {
      return await redisClient.zRange(key, start, stop, { REV: true });
    }
    return await redisClient.zRange(key, start, stop);
  } catch (error) {
    logger.error('Failed to get sorted set range:', error);
    return [];
  }
};

export const incrementSortedSetScore = async (
  key: string,
  value: string,
  increment: number = 1
): Promise<number> => {
  if (!redisClient || !redisClient.isOpen) {
    return 0;
  }

  try {
    return await redisClient.zIncrBy(key, increment, value);
  } catch (error) {
    logger.error('Failed to increment sorted set score:', error);
    return 0;
  }
};

export const setHash = async (key: string, field: string, value: string): Promise<void> => {
  if (!redisClient || !redisClient.isOpen) {
    return;
  }

  try {
    await redisClient.hSet(key, field, value);
  } catch (error) {
    logger.error('Failed to set hash field:', error);
  }
};

export const getHash = async (key: string, field: string): Promise<string | null> => {
  if (!redisClient || !redisClient.isOpen) {
    return null;
  }

  try {
    return await redisClient.hGet(key, field);
  } catch (error) {
    logger.error('Failed to get hash field:', error);
    return null;
  }
};

export const getAllHash = async (key: string): Promise<Record<string, string>> => {
  if (!redisClient || !redisClient.isOpen) {
    return {};
  }

  try {
    return await redisClient.hGetAll(key);
  } catch (error) {
    logger.error('Failed to get all hash fields:', error);
    return {};
  }
};

export const publishMessage = async (channel: string, message: string): Promise<void> => {
  if (!redisClient || !redisClient.isOpen) {
    return;
  }

  try {
    await redisClient.publish(channel, message);
  } catch (error) {
    logger.error('Failed to publish message:', error);
  }
};

function generateCacheKey(req: Request): string {
  const baseKey = `cache:${req.path}`;
  const queryString = Object.keys(req.query)
    .sort()
    .map((key) => `${key}=${req.query[key]}`)
    .join('&');

  return queryString ? `${baseKey}?${queryString}` : baseKey;
}

export const closeRedis = async (): Promise<void> => {
  if (redisClient && redisClient.isOpen) {
    await redisClient.quit();
    logger.info('Redis client disconnected');
  }
};

export { redisClient };
