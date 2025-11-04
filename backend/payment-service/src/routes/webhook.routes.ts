import { Router } from 'express';
import { WebhookController } from '../controllers/webhook.controller';

const router = Router();
const webhookController = new WebhookController();

router.post('/stripe', webhookController.handleStripeWebhook);
router.post('/paypal', webhookController.handlePayPalWebhook);
router.post('/square', webhookController.handleSquareWebhook);
router.post('/crypto', webhookController.handleCryptoWebhook);

export default router;
