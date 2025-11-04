import { Request, Response, NextFunction } from 'express';
import { metricsCollector } from '../utils/metrics';
import { logger } from '../utils/logger';

export class MetricsController {
  async getMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const metrics = metricsCollector.getMetrics(limit);

      res.json({
        success: true,
        data: metrics
      });
    } catch (error) {
      logger.error('Error fetching metrics:', error);
      next(error);
    }
  }

  async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = metricsCollector.getStats();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Error fetching stats:', error);
      next(error);
    }
  }

  async getTopPaths(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const topPaths = metricsCollector.getTopPaths(limit);

      res.json({
        success: true,
        data: topPaths
      });
    } catch (error) {
      logger.error('Error fetching top paths:', error);
      next(error);
    }
  }

  async getSlowestEndpoints(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const slowest = metricsCollector.getSlowestEndpoints(limit);

      res.json({
        success: true,
        data: slowest
      });
    } catch (error) {
      logger.error('Error fetching slowest endpoints:', error);
      next(error);
    }
  }

  async getErrorRate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const path = req.query.path as string;
      const errorRate = metricsCollector.getErrorRate(path);

      res.json({
        success: true,
        data: {
          path: path || 'all',
          errorRate: `${errorRate.toFixed(2)}%`
        }
      });
    } catch (error) {
      logger.error('Error fetching error rate:', error);
      next(error);
    }
  }

  async getAverageResponseTime(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const path = req.query.path as string;
      const avgTime = metricsCollector.getAverageResponseTime(path);

      res.json({
        success: true,
        data: {
          path: path || 'all',
          averageResponseTime: `${avgTime.toFixed(2)}ms`
        }
      });
    } catch (error) {
      logger.error('Error fetching average response time:', error);
      next(error);
    }
  }
}

export const metricsController = new MetricsController();
