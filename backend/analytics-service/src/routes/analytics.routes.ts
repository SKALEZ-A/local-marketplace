import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateAnalyticsQuery } from '../validators/analytics.validator';

const router = Router();
const analyticsController = new AnalyticsController();

router.use(authMiddleware);

router.get('/dashboard', analyticsController.getDashboardMetrics);
router.get('/sales', validateAnalyticsQuery, analyticsController.getSalesAnalytics);
router.get('/products', validateAnalyticsQuery, analyticsController.getProductAnalytics);
router.get('/users', validateAnalyticsQuery, analyticsController.getUserAnalytics);
router.get('/revenue', validateAnalyticsQuery, analyticsController.getRevenueAnalytics);
router.get('/traffic', validateAnalyticsQuery, analyticsController.getTrafficAnalytics);
router.get('/conversion', validateAnalyticsQuery, analyticsController.getConversionAnalytics);
router.get('/cohort', validateAnalyticsQuery, analyticsController.getCohortAnalysis);
router.get('/funnel', validateAnalyticsQuery, analyticsController.getFunnelAnalysis);
router.get('/retention', validateAnalyticsQuery, analyticsController.getRetentionAnalysis);
router.post('/events', analyticsController.trackEvent);
router.get('/export', validateAnalyticsQuery, analyticsController.exportAnalytics);

export default router;
