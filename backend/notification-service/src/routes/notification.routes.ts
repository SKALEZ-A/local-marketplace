import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateNotification } from '../validators/notification.validator';

const router = Router();
const notificationController = new NotificationController();

router.use(authMiddleware);

router.post('/send', validateNotification, notificationController.sendNotification);
router.post('/send-bulk', validateNotification, notificationController.sendBulkNotifications);
router.get('/', notificationController.getNotifications);
router.get('/:notificationId', notificationController.getNotification);
router.put('/:notificationId/read', notificationController.markAsRead);
router.put('/read-all', notificationController.markAllAsRead);
router.delete('/:notificationId', notificationController.deleteNotification);
router.get('/unread/count', notificationController.getUnreadCount);
router.post('/preferences', notificationController.updatePreferences);
router.get('/preferences', notificationController.getPreferences);
router.post('/subscribe', notificationController.subscribeToPush);
router.post('/unsubscribe', notificationController.unsubscribeFromPush);

export default router;
