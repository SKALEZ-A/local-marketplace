import { Request, Response } from 'express';
import axios from 'axios';

export class HealthController {
  async checkHealth(req: Request, res: Response): Promise<void> {
    const services = {
      auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
      product: process.env.PRODUCT_SERVICE_URL || 'http://localhost:3003',
      order: process.env.ORDER_SERVICE_URL || 'http://localhost:3004',
      payment: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3005',
      delivery: process.env.DELIVERY_SERVICE_URL || 'http://localhost:3006',
      review: process.env.REVIEW_SERVICE_URL || 'http://localhost:3007',
      chat: process.env.CHAT_SERVICE_URL || 'http://localhost:3008',
      search: process.env.SEARCH_SERVICE_URL || 'http://localhost:3009',
      recommendation: process.env.RECOMMENDATION_SERVICE_URL || 'http://localhost:3010',
      analytics: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3011',
      notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3012'
    };

    const healthChecks = await Promise.all(
      Object.entries(services).map(async ([name, url]) => {
        try {
          const response = await axios.get(`${url}/health`, { timeout: 5000 });
          return { name, status: 'healthy', url };
        } catch (error) {
          return { name, status: 'unhealthy', url };
        }
      })
    );

    const allHealthy = healthChecks.every(check => check.status === 'healthy');

    res.status(allHealthy ? 200 : 503).json({
      status: allHealthy ? 'healthy' : 'degraded',
      services: healthChecks,
      timestamp: new Date()
    });
  }

  async checkReadiness(req: Request, res: Response): Promise<void> {
    res.status(200).json({
      status: 'ready',
      timestamp: new Date()
    });
  }

  async checkLiveness(req: Request, res: Response): Promise<void> {
    res.status(200).json({
      status: 'alive',
      timestamp: new Date()
    });
  }
}
