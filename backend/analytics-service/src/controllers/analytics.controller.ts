import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from '../services/analytics.service';
import { logger } from '../utils/logger';

export class AnalyticsController {
  private analyticsService: AnalyticsService;

  constructor() {
    this.analyticsService = new AnalyticsService();
  }

  trackPageView = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = req.body;
      await this.analyticsService.trackPageView(data);

      res.status(200).json({
        success: true,
        message: 'Page view tracked'
      });
    } catch (error) {
      logger.error('Error tracking page view:', error);
      next(error);
    }
  };

  trackEvent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = req.body;
      await this.analyticsService.trackEvent(data);

      res.status(200).json({
        success: true,
        message: 'Event tracked'
      });
    } catch (error) {
      logger.error('Error tracking event:', error);
      next(error);
    }
  };

  getUserMetrics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;
      const metrics = await this.analyticsService.getUserMetrics(userId);

      res.status(200).json({
        success: true,
        data: metrics
      });
    } catch (error) {
      logger.error('Error fetching user metrics:', error);
      next(error);
    }
  };
}
