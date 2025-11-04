import { Router } from 'express';
import { ChatController } from '../controllers/chat.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateChatMessage, validateChatRoom } from '../validators/chat.validator';

const router = Router();
const chatController = new ChatController();

router.use(authMiddleware);

router.post('/rooms', validateChatRoom, chatController.createRoom);
router.get('/rooms', chatController.getRooms);
router.get('/rooms/:roomId', chatController.getRoom);
router.delete('/rooms/:roomId', chatController.deleteRoom);
router.post('/rooms/:roomId/messages', validateChatMessage, chatController.sendMessage);
router.get('/rooms/:roomId/messages', chatController.getMessages);
router.put('/messages/:messageId', validateChatMessage, chatController.updateMessage);
router.delete('/messages/:messageId', chatController.deleteMessage);
router.post('/messages/:messageId/read', chatController.markAsRead);
router.get('/unread', chatController.getUnreadCount);
router.post('/rooms/:roomId/typing', chatController.sendTypingIndicator);
router.post('/rooms/:roomId/join', chatController.joinRoom);
router.post('/rooms/:roomId/leave', chatController.leaveRoom);

export default router;
