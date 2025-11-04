import { Router } from 'express';
import { DeliveryController } from '../controllers/delivery.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateDelivery, validateDeliveryUpdate } from '../validators/delivery.validator';

const router = Router();
const deliveryController = new DeliveryController();

router.use(authMiddleware);

router.post('/', validateDelivery, deliveryController.createDelivery);
router.get('/', deliveryController.getDeliveries);
router.get('/:deliveryId', deliveryController.getDelivery);
router.put('/:deliveryId', validateDeliveryUpdate, deliveryController.updateDelivery);
router.post('/:deliveryId/assign', deliveryController.assignDriver);
router.post('/:deliveryId/pickup', deliveryController.markPickedUp);
router.post('/:deliveryId/deliver', deliveryController.markDelivered);
router.post('/:deliveryId/cancel', deliveryController.cancelDelivery);
router.get('/:deliveryId/track', deliveryController.trackDelivery);
router.post('/:deliveryId/location', deliveryController.updateLocation);
router.get('/:deliveryId/route', deliveryController.getOptimalRoute);
router.get('/driver/:driverId', deliveryController.getDriverDeliveries);
router.post('/:deliveryId/proof', deliveryController.uploadProofOfDelivery);

export default router;
