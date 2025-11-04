import { Router } from 'express';
import { metricsController } from '../controllers/metrics.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', metricsController.getMetrics);
router.get('/stats', metricsController.getStats);
router.get('/top-paths', metricsController.getTopPaths);
router.get('/slowest', metricsController.getSlowestEndpoints);
router.get('/error-rate', metricsController.getErrorRate);
router.get('/avg-response-time', metricsController.getAverageResponseTime);

export default router;
