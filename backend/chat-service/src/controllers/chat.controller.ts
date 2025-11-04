import { Request, Response, NextFunction } from 'express';
import { ChatService } from '../services/chat.service';

export class ChatController {
  private chatService: ChatService;

  constructor() {
    this.chatService = new ChatService();
  }

  createRoom = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      const roomData = req.body;
      
      const room = await this.chatService.createRoom(userId, roomData);
      
      res.status(201).json({
        success: true,
        data: room
      });
    } catch (error) {
      next(error);
    }
  };

  getRooms = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      const rooms = await this.chatService.getUserRooms(userId);
      
      res.status(200).json({
        success: true,
        data: rooms
      });
    } catch (error) {
      next(error);
    }
  };

  getRoom = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { roomId } = req.params;
      const room = await this.chatService.getRoom(roomId);
      
      res.status(200).json({
        success: true,
        data: room
      });
    } catch (error) {
      next(error);
    }
  };

  deleteRoom = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { roomId } = req.params;
      await this.chatService.deleteRoom(roomId);
      
      res.status(200).json({
        success: true,
        message: 'Room deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  sendMessage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      const { roomId } = req.params;
      const messageData = req.body;
      
      const message = await this.chatService.sendMessage(userId, roomId, messageData);
      
      res.status(201).json({
        success: true,
        data: message
      });
    } catch (error) {
      next(error);
    }
  };

  getMessages = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { roomId } = req.params;
      const { page = 1, limit = 50 } = req.query;
      
      const messages = await this.chatService.getMessages(roomId, {
        page: Number(page),
        limit: Number(limit)
      });
      
      res.status(200).json({
        success: true,
        data: messages
      });
    } catch (error) {
      next(error);
    }
  };

  updateMessage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { messageId } = req.params;
      const { content } = req.body;
      
      const message = await this.chatService.updateMessage(messageId, content);
      
      res.status(200).json({
        success: true,
        data: message
      });
    } catch (error) {
      next(error);
    }
  };

  deleteMessage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { messageId } = req.params;
      await this.chatService.deleteMessage(messageId);
      
      res.status(200).json({
        success: true,
        message: 'Message deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  markAsRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      const { messageId } = req.params;
      
      await this.chatService.markAsRead(messageId, userId);
      
      res.status(200).json({
        success: true,
        message: 'Message marked as read'
      });
    } catch (error) {
      next(error);
    }
  };

  getUnreadCount = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      const count = await this.chatService.getUnreadCount(userId);
      
      res.status(200).json({
        success: true,
        data: { count }
      });
    } catch (error) {
      next(error);
    }
  };

  sendTypingIndicator = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(200).json({
        success: true,
        message: 'Typing indicator sent'
      });
    } catch (error) {
      next(error);
    }
  };

  joinRoom = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      const { roomId } = req.params;
      
      await this.chatService.joinRoom(roomId, userId);
      
      res.status(200).json({
        success: true,
        message: 'Joined room successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  leaveRoom = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      const { roomId } = req.params;
      
      await this.chatService.leaveRoom(roomId, userId);
      
      res.status(200).json({
        success: true,
        message: 'Left room successfully'
      });
    } catch (error) {
      next(error);
    }
  };
}
