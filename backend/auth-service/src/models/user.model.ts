import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

export interface IUser {
  id: string;
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: UserRole;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isTwoFactorEnabled: boolean;
  twoFactorSecret?: string;
  profileImage?: string;
  address?: IAddress;
  preferences?: IUserPreferences;
  status: UserStatus;
  lastLogin?: Date;
  loginAttempts: number;
  lockUntil?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  refreshTokens: string[];
  oauthProviders?: IOAuthProvider[];
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  BUYER = 'BUYER',
  SELLER = 'SELLER',
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
  SUPPORT = 'SUPPORT'
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  BANNED = 'BANNED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION'
}

export interface IAddress {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  isDefault: boolean;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface IUserPreferences {
  language: string;
  currency: string;
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  privacy: {
    showEmail: boolean;
    showPhone: boolean;
    showAddress: boolean;
  };
  theme: 'light' | 'dark' | 'auto';
}

export interface IOAuthProvider {
  provider: 'google' | 'facebook' | 'apple';
  providerId: string;
  email: string;
  accessToken?: string;
  refreshToken?: string;
}

export class UserModel {
  static async create(userData: Partial<IUser>): Promise<IUser> {
    if (userData.password) {
      userData.password = await this.hashPassword(userData.password);
    }

    const user = await prisma.user.create({
      data: {
        ...userData,
        emailVerificationToken: this.generateToken(),
        emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    });

    return user as IUser;
  }

  static async findById(id: string): Promise<IUser | null> {
    const user = await prisma.user.findUnique({
      where: { id }
    });
    return user as IUser | null;
  }

  static async findByEmail(email: string): Promise<IUser | null> {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });
    return user as IUser | null;
  }

  static async update(id: string, updateData: Partial<IUser>): Promise<IUser> {
    if (updateData.password) {
      updateData.password = await this.hashPassword(updateData.password);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData
    });

    return user as IUser;
  }

  static async delete(id: string): Promise<void> {
    await prisma.user.delete({
      where: { id }
    });
  }

  static async comparePassword(candidatePassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, hashedPassword);
  }

  static async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(12);
    return bcrypt.hash(password, salt);
  }

  static generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  static async incrementLoginAttempts(userId: string): Promise<void> {
    const user = await this.findById(userId);
    if (!user) return;

    const updates: Partial<IUser> = {
      loginAttempts: user.loginAttempts + 1
    };

    if (user.loginAttempts + 1 >= 5) {
      updates.lockUntil = new Date(Date.now() + 2 * 60 * 60 * 1000); // Lock for 2 hours
    }

    await this.update(userId, updates);
  }

  static async resetLoginAttempts(userId: string): Promise<void> {
    await this.update(userId, {
      loginAttempts: 0,
      lockUntil: undefined
    });
  }

  static async isAccountLocked(userId: string): Promise<boolean> {
    const user = await this.findById(userId);
    if (!user || !user.lockUntil) return false;
    
    if (user.lockUntil < new Date()) {
      await this.resetLoginAttempts(userId);
      return false;
    }
    
    return true;
  }

  static async createPasswordResetToken(userId: string): Promise<string> {
    const resetToken = this.generateToken();
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    await this.update(userId, {
      passwordResetToken: hashedToken,
      passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    });

    return resetToken;
  }

  static async verifyPasswordResetToken(token: string): Promise<IUser | null> {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpires: {
          gt: new Date()
        }
      }
    });

    return user as IUser | null;
  }

  static async verifyEmail(token: string): Promise<IUser | null> {
    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerificationExpires: {
          gt: new Date()
        }
      }
    });

    if (user) {
      await this.update(user.id, {
        isEmailVerified: true,
        emailVerificationToken: undefined,
        emailVerificationExpires: undefined,
        status: UserStatus.ACTIVE
      });
    }

    return user as IUser | null;
  }

  static async addRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const user = await this.findById(userId);
    if (!user) return;

    const refreshTokens = [...(user.refreshTokens || []), refreshToken];
    
    // Keep only last 5 refresh tokens
    if (refreshTokens.length > 5) {
      refreshTokens.shift();
    }

    await this.update(userId, { refreshTokens });
  }

  static async removeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const user = await this.findById(userId);
    if (!user) return;

    const refreshTokens = (user.refreshTokens || []).filter(token => token !== refreshToken);
    await this.update(userId, { refreshTokens });
  }

  static async updateLastLogin(userId: string): Promise<void> {
    await this.update(userId, {
      lastLogin: new Date()
    });
  }

  static async searchUsers(query: string, filters?: any): Promise<IUser[]> {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: query, mode: 'insensitive' } },
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } }
        ],
        ...filters
      },
      take: 50
    });

    return users as IUser[];
  }

  static async getUsersByRole(role: UserRole): Promise<IUser[]> {
    const users = await prisma.user.findMany({
      where: { role }
    });

    return users as IUser[];
  }

  static async getUserStats(userId: string): Promise<any> {
    // This would aggregate data from various services
    return {
      totalOrders: 0,
      totalSpent: 0,
      totalSales: 0,
      reviewsGiven: 0,
      reviewsReceived: 0,
      averageRating: 0
    };
  }
}
