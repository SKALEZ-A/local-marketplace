import { ConversationModel } from '../models/conversation.model';
import { MessageModel } from '../models/message.model';
import { logger } from '../utils/logger';
import { AppError } from '../utils/appError';
import { S3Service } from './s3.service';
import { publishEvent } from '../config/rabbitmq';
import { io } from '../index';

export class ChatService {
  private s3Service: S3Service;

  constructor() {
    this.s3Service = new S3Service();
  }

  async createConversation(data: {
    participants: string[];
    type: 'direct' | 'group';
    name?: string;
    createdBy: string;
  }) {
    try {
      const conversation = await ConversationModel.create({
        participants: data.participants,
        type: data.type,
        name: data.name,
        createdBy: data.createdBy,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Notify participants
      data.participants.forEach(participantId => {
        io.to(participantId).emit('conversation:created', conversation);
      });

      await publishEvent('conversation.created', {
        conversationId: conversation._id,
        participants: data.participants
      });

      logger.info(`Conversation created: ${conversation._id}`);

      return conversation;
    } catch (error: any) {
      logger.error('Conversation creation failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async getConversation(conversationId: string, userId: string) {
    try {
      const conversation = await ConversationModel.findOne({
        _id: conversationId,
        participants: userId
      }).populate('participants', 'name email avatar');

      if (!conversation) {
        throw new AppError('Conversation not found', 404);
      }

      return conversation;
    } catch (error: any) {
      logger.error('Conversation retrieval failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async getUserConversations(userId: string, page: number = 1, limit: number = 20) {
    try {
      const skip = (page - 1) * limit;

      const conversations = await ConversationModel.find({
        participants: userId
      })
        .populate('participants', 'name email avatar')
        .populate('lastMessage')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await ConversationModel.countDocuments({
        participants: userId
      });

      return {
        conversations,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error: any) {
      logger.error('User conversations retrieval failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async sendMessage(data: {
    conversationId: string;
    senderId: string;
    content: string;
    type: 'text' | 'image' | 'file' | 'audio' | 'video';
    attachments?: any[];
  }) {
    try {
      // Verify sender is participant
      const conversation = await ConversationModel.findOne({
        _id: data.conversationId,
        participants: data.senderId
      });

      if (!conversation) {
        throw new AppError('Conversation not found or access denied', 404);
      }

      // Create message
      const message = await MessageModel.create({
        conversationId: data.conversationId,
        senderId: data.senderId,
        content: data.content,
        type: data.type,
        attachments: data.attachments || [],
        timestamp: new Date(),
        status: 'sent'
      });

      // Update conversation
      await ConversationModel.findByIdAndUpdate(data.conversationId, {
        lastMessage: message._id,
        updatedAt: new Date()
      });

      // Populate sender info
      await message.populate('senderId', 'name email avatar');

      // Emit to all participants
      conversation.participants.forEach(participantId => {
        if (participantId.toString() !== data.senderId) {
          io.to(participantId.toString()).emit('message:new', message);
        }
      });

      await publishEvent('message.sent', {
        messageId: message._id,
        conversationId: data.conversationId,
        senderId: data.senderId,
        recipientIds: conversation.participants.filter(
          p => p.toString() !== data.senderId
        )
      });

      logger.info(`Message sent: ${message._id}`);

      return message;
    } catch (error: any) {
      logger.error('Message sending failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async getMessages(
    conversationId: string,
    userId: string,
    page: number = 1,
    limit: number = 50
  ) {
    try {
      // Verify user is participant
      const conversation = await ConversationModel.findOne({
        _id: conversationId,
        participants: userId
      });

      if (!conversation) {
        throw new AppError('Conversation not found or access denied', 404);
      }

      const skip = (page - 1) * limit;

      const messages = await MessageModel.find({
        conversationId
      })
        .populate('senderId', 'name email avatar')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit);

      const total = await MessageModel.countDocuments({
        conversationId
      });

      return {
        messages: messages.reverse(), // Return in chronological order
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error: any) {
      logger.error('Messages retrieval failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async markMessageAsRead(messageId: string, userId: string) {
    try {
      const message = await MessageModel.findById(messageId);

      if (!message) {
        throw new AppError('Message not found', 404);
      }

      // Verify user is recipient
      const conversation = await ConversationModel.findOne({
        _id: message.conversationId,
        participants: userId
      });

      if (!conversation) {
        throw new AppError('Access denied', 403);
      }

      // Update message status
      await MessageModel.findByIdAndUpdate(messageId, {
        status: 'read',
        readAt: new Date()
      });

      // Notify sender
      io.to(message.senderId.toString()).emit('message:read', {
        messageId,
        readBy: userId,
        readAt: new Date()
      });

      logger.info(`Message marked as read: ${messageId}`);
    } catch (error: any) {
      logger.error('Mark message as read failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async markConversationAsRead(conversationId: string, userId: string) {
    try {
      // Verify user is participant
      const conversation = await ConversationModel.findOne({
        _id: conversationId,
        participants: userId
      });

      if (!conversation) {
        throw new AppError('Conversation not found or access denied', 404);
      }

      // Mark all unread messages as read
      await MessageModel.updateMany(
        {
          conversationId,
          senderId: { $ne: userId },
          status: { $ne: 'read' }
        },
        {
          status: 'read',
          readAt: new Date()
        }
      );

      logger.info(`Conversation marked as read: ${conversationId}`);
    } catch (error: any) {
      logger.error('Mark conversation as read failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async deleteMessage(messageId: string, userId: string) {
    try {
      const message = await MessageModel.findById(messageId);

      if (!message) {
        throw new AppError('Message not found', 404);
      }

      // Only sender can delete
      if (message.senderId.toString() !== userId) {
        throw new AppError('Only sender can delete message', 403);
      }

      await MessageModel.findByIdAndUpdate(messageId, {
        deleted: true,
        deletedAt: new Date()
      });

      // Notify participants
      const conversation = await ConversationModel.findById(message.conversationId);
      conversation?.participants.forEach(participantId => {
        io.to(participantId.toString()).emit('message:deleted', {
          messageId,
          conversationId: message.conversationId
        });
      });

      logger.info(`Message deleted: ${messageId}`);
    } catch (error: any) {
      logger.error('Message deletion failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async uploadAttachment(file: Express.Multer.File, userId: string) {
    try {
      const uploadResult = await this.s3Service.uploadFile(file, 'chat-attachments');

      return {
        url: uploadResult.url,
        key: uploadResult.key,
        type: file.mimetype,
        size: file.size,
        name: file.originalname
      };
    } catch (error: any) {
      logger.error('Attachment upload failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async searchMessages(conversationId: string, query: string, userId: string) {
    try {
      // Verify user is participant
      const conversation = await ConversationModel.findOne({
        _id: conversationId,
        participants: userId
      });

      if (!conversation) {
        throw new AppError('Conversation not found or access denied', 404);
      }

      const messages = await MessageModel.find({
        conversationId,
        content: { $regex: query, $options: 'i' },
        deleted: { $ne: true }
      })
        .populate('senderId', 'name email avatar')
        .sort({ timestamp: -1 })
        .limit(50);

      return messages;
    } catch (error: any) {
      logger.error('Message search failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async getUnreadCount(userId: string) {
    try {
      const conversations = await ConversationModel.find({
        participants: userId
      }).select('_id');

      const conversationIds = conversations.map(c => c._id);

      const unreadCount = await MessageModel.countDocuments({
        conversationId: { $in: conversationIds },
        senderId: { $ne: userId },
        status: { $ne: 'read' },
        deleted: { $ne: true }
      });

      return { unreadCount };
    } catch (error: any) {
      logger.error('Unread count retrieval failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async addParticipant(conversationId: string, userId: string, newParticipantId: string) {
    try {
      const conversation = await ConversationModel.findOne({
        _id: conversationId,
        participants: userId
      });

      if (!conversation) {
        throw new AppError('Conversation not found or access denied', 404);
      }

      if (conversation.type !== 'group') {
        throw new AppError('Can only add participants to group conversations', 400);
      }

      // Add participant
      await ConversationModel.findByIdAndUpdate(conversationId, {
        $addToSet: { participants: newParticipantId },
        updatedAt: new Date()
      });

      // Notify all participants
      const updatedConversation = await ConversationModel.findById(conversationId)
        .populate('participants', 'name email avatar');

      updatedConversation?.participants.forEach(participant => {
        io.to(participant._id.toString()).emit('conversation:participant_added', {
          conversationId,
          newParticipant: newParticipantId
        });
      });

      logger.info(`Participant added to conversation: ${conversationId}`);

      return updatedConversation;
    } catch (error: any) {
      logger.error('Add participant failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async removeParticipant(conversationId: string, userId: string, participantId: string) {
    try {
      const conversation = await ConversationModel.findOne({
        _id: conversationId,
        participants: userId
      });

      if (!conversation) {
        throw new AppError('Conversation not found or access denied', 404);
      }

      if (conversation.type !== 'group') {
        throw new AppError('Can only remove participants from group conversations', 400);
      }

      // Only creator can remove participants
      if (conversation.createdBy.toString() !== userId && participantId !== userId) {
        throw new AppError('Only creator can remove other participants', 403);
      }

      // Remove participant
      await ConversationModel.findByIdAndUpdate(conversationId, {
        $pull: { participants: participantId },
        updatedAt: new Date()
      });

      // Notify all participants
      conversation.participants.forEach(participant => {
        io.to(participant.toString()).emit('conversation:participant_removed', {
          conversationId,
          removedParticipant: participantId
        });
      });

      logger.info(`Participant removed from conversation: ${conversationId}`);
    } catch (error: any) {
      logger.error('Remove participant failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async updateTypingStatus(conversationId: string, userId: string, isTyping: boolean) {
    try {
      const conversation = await ConversationModel.findOne({
        _id: conversationId,
        participants: userId
      });

      if (!conversation) {
        throw new AppError('Conversation not found or access denied', 404);
      }

      // Notify other participants
      conversation.participants.forEach(participantId => {
        if (participantId.toString() !== userId) {
          io.to(participantId.toString()).emit('user:typing', {
            conversationId,
            userId,
            isTyping
          });
        }
      });
    } catch (error: any) {
      logger.error('Update typing status failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async getConversationStats(conversationId: string, userId: string) {
    try {
      const conversation = await ConversationModel.findOne({
        _id: conversationId,
        participants: userId
      });

      if (!conversation) {
        throw new AppError('Conversation not found or access denied', 404);
      }

      const totalMessages = await MessageModel.countDocuments({
        conversationId,
        deleted: { $ne: true }
      });

      const unreadMessages = await MessageModel.countDocuments({
        conversationId,
        senderId: { $ne: userId },
        status: { $ne: 'read' },
        deleted: { $ne: true }
      });

      const messagesByType = await MessageModel.aggregate([
        {
          $match: {
            conversationId: conversation._id,
            deleted: { $ne: true }
          }
        },
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 }
          }
        }
      ]);

      return {
        totalMessages,
        unreadMessages,
        messagesByType,
        participantCount: conversation.participants.length
      };
    } catch (error: any) {
      logger.error('Conversation stats retrieval failed:', error);
      throw new AppError(error.message, 500);
    }
  }
}
