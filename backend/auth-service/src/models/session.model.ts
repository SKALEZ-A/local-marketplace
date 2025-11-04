import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

export interface ISession {
  id: string;
  userId: string;
  token: string;
  refreshToken: string;
  deviceInfo: IDeviceInfo;
  ipAddress: string;
  userAgent: string;
  isActive: boolean;
  expiresAt: Date;
  lastActivityAt: Date;
  createdAt: Date;
}

export interface IDeviceInfo {
  deviceId: string;
  deviceType: 'mobile' | 'tablet' | 'desktop' | 'unknown';
  os: string;
  browser: string;
  location?: {
    country: string;
    city: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
}

export class SessionModel {
  static async create(sessionData: Partial<ISession>): Promise<ISession> {
    const token = this.generateSessionToken();
    const refreshToken = this.generateRefreshToken();

    const session = await prisma.session.create({
      data: {
        ...sessionData,
        token,
        refreshToken,
        isActive: true,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        lastActivityAt: new Date()
      }
    });

    return session as ISession;
  }

  static async findById(id: string): Promise<ISession | null> {
    const session = await prisma.session.findUnique({
      where: { id }
    });
    return session as ISession | null;
  }

  static async findByToken(token: string): Promise<ISession | null> {
    const session = await prisma.session.findFirst({
      where: {
        token,
        isActive: true,
        expiresAt: {
          gt: new Date()
        }
      }
    });
    return session as ISession | null;
  }

  static async findByRefreshToken(refreshToken: string): Promise<ISession | null> {
    const session = await prisma.session.findFirst({
      where: {
        refreshToken,
        isActive: true
      }
    });
    return session as ISession | null;
  }

  static async findUserSessions(userId: string): Promise<ISession[]> {
    const sessions = await prisma.session.findMany({
      where: {
        userId,
        isActive: true,
        expiresAt: {
          gt: new Date()
        }
      },
      orderBy: {
        lastActivityAt: 'desc'
      }
    });
    return sessions as ISession[];
  }

  static async updateActivity(sessionId: string): Promise<void> {
    await prisma.session.update({
      where: { id: sessionId },
      data: {
        lastActivityAt: new Date()
      }
    });
  }

  static async refreshSession(sessionId: string): Promise<ISession> {
    const newRefreshToken = this.generateRefreshToken();
    
    const session = await prisma.session.update({
      where: { id: sessionId },
      data: {
        refreshToken: newRefreshToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        lastActivityAt: new Date()
      }
    });

    return session as ISession;
  }

  static async invalidate(sessionId: string): Promise<void> {
    await prisma.session.update({
      where: { id: sessionId },
      data: {
        isActive: false
      }
    });
  }

  static async invalidateUserSessions(userId: string, exceptSessionId?: string): Promise<void> {
    await prisma.session.updateMany({
      where: {
        userId,
        id: exceptSessionId ? { not: exceptSessionId } : undefined
      },
      data: {
        isActive: false
      }
    });
  }

  static async cleanupExpiredSessions(): Promise<number> {
    const result = await prisma.session.deleteMany({
      where: {
        OR: [
          {
            expiresAt: {
              lt: new Date()
            }
          },
          {
            isActive: false,
            lastActivityAt: {
              lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days old
            }
          }
        ]
      }
    });

    return result.count;
  }

  static generateSessionToken(): string {
    return crypto.randomBytes(48).toString('hex');
  }

  static generateRefreshToken(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  static parseUserAgent(userAgent: string): Partial<IDeviceInfo> {
    const deviceInfo: Partial<IDeviceInfo> = {
      deviceType: 'unknown',
      os: 'Unknown',
      browser: 'Unknown'
    };

    // Detect device type
    if (/mobile/i.test(userAgent)) {
      deviceInfo.deviceType = 'mobile';
    } else if (/tablet|ipad/i.test(userAgent)) {
      deviceInfo.deviceType = 'tablet';
    } else if (/desktop|windows|mac|linux/i.test(userAgent)) {
      deviceInfo.deviceType = 'desktop';
    }

    // Detect OS
    if (/windows/i.test(userAgent)) {
      deviceInfo.os = 'Windows';
    } else if (/mac/i.test(userAgent)) {
      deviceInfo.os = 'macOS';
    } else if (/linux/i.test(userAgent)) {
      deviceInfo.os = 'Linux';
    } else if (/android/i.test(userAgent)) {
      deviceInfo.os = 'Android';
    } else if (/ios|iphone|ipad/i.test(userAgent)) {
      deviceInfo.os = 'iOS';
    }

    // Detect browser
    if (/chrome/i.test(userAgent) && !/edge/i.test(userAgent)) {
      deviceInfo.browser = 'Chrome';
    } else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) {
      deviceInfo.browser = 'Safari';
    } else if (/firefox/i.test(userAgent)) {
      deviceInfo.browser = 'Firefox';
    } else if (/edge/i.test(userAgent)) {
      deviceInfo.browser = 'Edge';
    }

    return deviceInfo;
  }

  static async getSessionAnalytics(userId: string): Promise<any> {
    const sessions = await this.findUserSessions(userId);
    
    const deviceTypes = sessions.reduce((acc, session) => {
      const type = session.deviceInfo.deviceType;
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const browsers = sessions.reduce((acc, session) => {
      const browser = session.deviceInfo.browser;
      acc[browser] = (acc[browser] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalActiveSessions: sessions.length,
      deviceTypes,
      browsers,
      locations: sessions.map(s => s.deviceInfo.location).filter(Boolean)
    };
  }
}
