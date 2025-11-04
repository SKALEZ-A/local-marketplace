import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';

interface RequestMetrics {
  method: string;
  path: string;
  statusCode: number;
  responseTime: number;
  timestamp: Date;
}

class MonitoringService {
  private metrics: RequestMetrics[] = [];
  private readonly maxMetrics = 1000;

  trackRequest(req: Request, res: Response, startTime: number) {
    const metric: RequestMetrics = {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      responseTime: Date.now() - startTime,
      timestamp: new Date()
    };

    this.metrics.push(metric);
    
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    if (metric.responseTime > 1000) {
      logger.warn(`Slow request detected: ${metric.method} ${metric.path} - ${metric.responseTime}ms`);
    }
  }

  getMetrics() {
    return {
      total: this.metrics.length,
      averageResponseTime: this.calculateAverageResponseTime(),
      requestsByMethod: this.groupByMethod(),
      requestsByStatus: this.groupByStatus(),
      slowRequests: this.getSlowRequests()
    };
  }

  private calculateAverageResponseTime(): number {
    if (this.metrics.length === 0) return 0;
    const sum = this.metrics.reduce((acc, m) => acc + m.responseTime, 0);
    return sum / this.metrics.length;
  }

  private groupByMethod() {
    return this.metrics.reduce((acc, m) => {
      acc[m.method] = (acc[m.method] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private groupByStatus() {
    return this.metrics.reduce((acc, m) => {
      const statusGroup = Math.floor(m.statusCode / 100) * 100;
      acc[statusGroup] = (acc[statusGroup] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
  }

  private getSlowRequests() {
    return this.metrics
      .filter(m => m.responseTime > 1000)
      .sort((a, b) => b.responseTime - a.responseTime)
      .slice(0, 10);
  }
}

export const monitoringService = new MonitoringService();

export const monitoringMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  res.on('finish', () => {
    monitoringService.trackRequest(req, res, startTime);
  });

  next();
};
