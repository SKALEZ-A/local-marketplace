import { SessionModel, Session } from '../models/session.model';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export class SessionService {
  private sessionModel: SessionModel;

  constructor() {
    this.sessionModel = new SessionModel();
  }

  async createSession(userId: string, userAgent: string, ipAddress: string): Promise<Session> {
    try {
      const sessionId = uuidv4();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

      const session = await this.sessionModel.create({
        id: sessionId,
        userId,
        userAgent,
        ipAddress,
        expiresAt,
        createdAt: new Date(),
        lastActivity: new Date()
      });

      logger.info(`Session created for user ${userId}`);
      return session;
    } catch (error) {
      logger.error('Error creating session:', error);
      throw error;
    }
  }

  async getSession(sessionId: string): Promise<Session> {
    try {
      const session = await this.sessionModel.findById(sessionId);
      
      if (!session) {
        throw new AppError('Session not found', 404);
      }

      if (new Date() > session.expiresAt) {
        await this.sessionModel.delete(sessionId);
        throw new AppError('Session expired', 401);
      }

      await this.sessionModel.update(sessionId, {
        lastActivity: new Date()
      });

      return session;
    } catch (error) {
      logger.error('Error fetching session:', error);
      throw error;
    }
  }

  async getUserSessions(userId: string): Promise<Session[]> {
    try {
      return await this.sessionModel.findByUserId(userId);
    } catch (error) {
      logger.error('Error fetching user sessions:', error);
      throw error;
    }
  }

  async deleteSession(sessionId: string, userId: string): Promise<void> {
    try {
      const session = await this.sessionModel.findById(sessionId);
      
      if (!session) {
        throw new AppError('Session not found', 404);
      }

      if (session.userId !== userId) {
        throw new AppError('Unauthorized', 403);
      }

      await this.sessionModel.delete(sessionId);
      logger.info(`Session ${sessionId} deleted`);
    } catch (error) {
      logger.error('Error deleting session:', error);
      throw error;
    }
  }

  async deleteAllUserSessions(userId: string, exceptSessionId?: string): Promise<void> {
    try {
      await this.sessionModel.deleteAllByUserId(userId, exceptSessionId);
      logger.info(`All sessions deleted for user ${userId}`);
    } catch (error) {
      logger.error('Error deleting user sessions:', error);
      throw error;
    }
  }

  async cleanupExpiredSessions(): Promise<void> {
    try {
      await this.sessionModel.deleteExpired();
      logger.info('Expired sessions cleaned up');
    } catch (error) {
      logger.error('Error cleaning up expired sessions:', error);
    }
  }
}
