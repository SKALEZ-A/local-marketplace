import { Router } from 'express';
import { HealthController } from '../controllers/health.controller';

const router = Router();
const healthController = new HealthController();

router.get('/health', healthController.checkHealth);
router.get('/ready', healthController.checkReadiness);
router.get('/live', healthController.checkLiveness);

export default router;
