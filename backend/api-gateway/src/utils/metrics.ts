import { Request, Response } from 'express';
import { logger } from './logger';

interface MetricData {
  timestamp: number;
  method: string;
  path: string;
  statusCode: number;
  responseTime: number;
  userAgent?: string;
  ip?: string;
}

class MetricsCollector {
  private metrics: MetricData[] = [];
  private maxMetrics: number = 10000;

  recordRequest(data: MetricData): void {
    this.metrics.push(data);
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
  }

  getMetrics(limit: number = 100): MetricData[] {
    return this.metrics.slice(-limit);
  }

  getAverageResponseTime(path?: string): number {
    const filtered = path 
      ? this.metrics.filter(m => m.path === path)
      : this.metrics;
    
    if (filtered.length === 0) return 0;
    
    const sum = filtered.reduce((acc, m) => acc + m.responseTime, 0);
    return sum / filtered.length;
  }

  getRequestCount(path?: string, statusCode?: number): number {
    return this.metrics.filter(m => {
      if (path && m.path !== path) return false;
      if (statusCode && m.statusCode !== statusCode) return false;
      return true;
    }).length;
  }

  getErrorRate(path?: string): number {
    const filtered = path 
      ? this.metrics.filter(m => m.path === path)
      : this.metrics;
    
    if (filtered.length === 0) return 0;
    
    const errors = filtered.filter(m => m.statusCode >= 400).length;
    return (errors / filtered.length) * 100;
  }

  getTopPaths(limit: number = 10): Array<{ path: string; count: number }> {
    const pathCounts = new Map<string, number>();
    
    this.metrics.forEach(m => {
      pathCounts.set(m.path, (pathCounts.get(m.path) || 0) + 1);
    });
    
    return Array.from(pathCounts.entries())
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  getSlowestEndpoints(limit: number = 10): Array<{ path: string; avgTime: number }> {
    const pathTimes = new Map<string, number[]>();
    
    this.metrics.forEach(m => {
      if (!pathTimes.has(m.path)) {
        pathTimes.set(m.path, []);
      }
      pathTimes.get(m.path)!.push(m.responseTime);
    });
    
    return Array.from(pathTimes.entries())
      .map(([path, times]) => ({
        path,
        avgTime: times.reduce((a, b) => a + b, 0) / times.length
      }))
      .sort((a, b) => b.avgTime - a.avgTime)
      .slice(0, limit);
  }

  clear(): void {
    this.metrics = [];
  }

  getStats() {
    const now = Date.now();
    const last5Min = this.metrics.filter(m => now - m.timestamp < 5 * 60 * 1000);
    const last1Hour = this.metrics.filter(m => now - m.timestamp < 60 * 60 * 1000);

    return {
      total: this.metrics.length,
      last5Minutes: {
        count: last5Min.length,
        avgResponseTime: this.calculateAvg(last5Min.map(m => m.responseTime)),
        errorRate: this.calculateErrorRate(last5Min)
      },
      lastHour: {
        count: last1Hour.length,
        avgResponseTime: this.calculateAvg(last1Hour.map(m => m.responseTime)),
        errorRate: this.calculateErrorRate(last1Hour)
      }
    };
  }

  private calculateAvg(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((a, b) => a + b, 0) / numbers.length;
  }

  private calculateErrorRate(metrics: MetricData[]): number {
    if (metrics.length === 0) return 0;
    const errors = metrics.filter(m => m.statusCode >= 400).length;
    return (errors / metrics.length) * 100;
  }
}

export const metricsCollector = new MetricsCollector();

export const metricsMiddleware = (req: Request, res: Response, next: Function) => {
  const start = Date.now();

  res.on('finish', () => {
    const responseTime = Date.now() - start;
    
    metricsCollector.recordRequest({
      timestamp: Date.now(),
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      responseTime,
      userAgent: req.headers['user-agent'],
      ip: req.ip
    });
  });

  next();
};
