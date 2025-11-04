import jwt from 'jsonwebtoken';
import { IUser } from '../models/user.model';

export interface ITokenPayload {
  userId: string;
  email: string;
  role: string;
  sessionId?: string;
}

export interface ITokenPair {
  accessToken: string;
  refreshToken: string;
}

export class TokenService {
  private static readonly ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET || 'access-secret-key';
  private static readonly REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh-secret-key';
  private static readonly ACCESS_TOKEN_EXPIRY = '15m';
  private static readonly REFRESH_TOKEN_EXPIRY = '7d';

  static generateAccessToken(payload: ITokenPayload): string {
    return jwt.sign(payload, this.ACCESS_TOKEN_SECRET, {
      expiresIn: this.ACCESS_TOKEN_EXPIRY,
      issuer: 'marketplace-auth',
      audience: 'marketplace-api'
    });
  }

  static generateRefreshToken(payload: ITokenPayload): string {
    return jwt.sign(payload, this.REFRESH_TOKEN_SECRET, {
      expiresIn: this.REFRESH_TOKEN_EXPIRY,
      issuer: 'marketplace-auth',
      audience: 'marketplace-api'
    });
  }

  static generateTokenPair(user: IUser, sessionId?: string): ITokenPair {
    const payload: ITokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      sessionId
    };

    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload)
    };
  }

  static verifyAccessToken(token: string): ITokenPayload {
    try {
      const decoded = jwt.verify(token, this.ACCESS_TOKEN_SECRET, {
        issuer: 'marketplace-auth',
        audience: 'marketplace-api'
      }) as ITokenPayload;
      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired access token');
    }
  }

  static verifyRefreshToken(token: string): ITokenPayload {
    try {
      const decoded = jwt.verify(token, this.REFRESH_TOKEN_SECRET, {
        issuer: 'marketplace-auth',
        audience: 'marketplace-api'
      }) as ITokenPayload;
      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  static decodeToken(token: string): ITokenPayload | null {
    try {
      const decoded = jwt.decode(token) as ITokenPayload;
      return decoded;
    } catch (error) {
      return null;
    }
  }

  static isTokenExpired(token: string): boolean {
    try {
      const decoded = jwt.decode(token) as any;
      if (!decoded || !decoded.exp) return true;
      
      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp < currentTime;
    } catch (error) {
      return true;
    }
  }

  static getTokenExpiry(token: string): Date | null {
    try {
      const decoded = jwt.decode(token) as any;
      if (!decoded || !decoded.exp) return null;
      
      return new Date(decoded.exp * 1000);
    } catch (error) {
      return null;
    }
  }

  static generateApiKey(userId: string): string {
    const payload = {
      userId,
      type: 'api_key',
      createdAt: Date.now()
    };

    return jwt.sign(payload, this.ACCESS_TOKEN_SECRET, {
      expiresIn: '365d',
      issuer: 'marketplace-auth',
      audience: 'marketplace-api'
    });
  }

  static verifyApiKey(apiKey: string): ITokenPayload {
    try {
      const decoded = jwt.verify(apiKey, this.ACCESS_TOKEN_SECRET, {
        issuer: 'marketplace-auth',
        audience: 'marketplace-api'
      }) as any;

      if (decoded.type !== 'api_key') {
        throw new Error('Invalid API key');
      }

      return {
        userId: decoded.userId,
        email: '',
        role: ''
      };
    } catch (error) {
      throw new Error('Invalid or expired API key');
    }
  }

  static generateEmailVerificationToken(email: string): string {
    const payload = {
      email,
      type: 'email_verification',
      timestamp: Date.now()
    };

    return jwt.sign(payload, this.ACCESS_TOKEN_SECRET, {
      expiresIn: '24h',
      issuer: 'marketplace-auth'
    });
  }

  static verifyEmailVerificationToken(token: string): string {
    try {
      const decoded = jwt.verify(token, this.ACCESS_TOKEN_SECRET, {
        issuer: 'marketplace-auth'
      }) as any;

      if (decoded.type !== 'email_verification') {
        throw new Error('Invalid verification token');
      }

      return decoded.email;
    } catch (error) {
      throw new Error('Invalid or expired verification token');
    }
  }

  static generatePasswordResetToken(userId: string, email: string): string {
    const payload = {
      userId,
      email,
      type: 'password_reset',
      timestamp: Date.now()
    };

    return jwt.sign(payload, this.ACCESS_TOKEN_SECRET, {
      expiresIn: '1h',
      issuer: 'marketplace-auth'
    });
  }

  static verifyPasswordResetToken(token: string): { userId: string; email: string } {
    try {
      const decoded = jwt.verify(token, this.ACCESS_TOKEN_SECRET, {
        issuer: 'marketplace-auth'
      }) as any;

      if (decoded.type !== 'password_reset') {
        throw new Error('Invalid reset token');
      }

      return {
        userId: decoded.userId,
        email: decoded.email
      };
    } catch (error) {
      throw new Error('Invalid or expired reset token');
    }
  }

  static generateInvitationToken(email: string, role: string, invitedBy: string): string {
    const payload = {
      email,
      role,
      invitedBy,
      type: 'invitation',
      timestamp: Date.now()
    };

    return jwt.sign(payload, this.ACCESS_TOKEN_SECRET, {
      expiresIn: '7d',
      issuer: 'marketplace-auth'
    });
  }

  static verifyInvitationToken(token: string): { email: string; role: string; invitedBy: string } {
    try {
      const decoded = jwt.verify(token, this.ACCESS_TOKEN_SECRET, {
        issuer: 'marketplace-auth'
      }) as any;

      if (decoded.type !== 'invitation') {
        throw new Error('Invalid invitation token');
      }

      return {
        email: decoded.email,
        role: decoded.role,
        invitedBy: decoded.invitedBy
      };
    } catch (error) {
      throw new Error('Invalid or expired invitation token');
    }
  }
}
