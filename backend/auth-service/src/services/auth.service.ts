import { UserModel } from '../models/user.model';
import { SessionService } from './session.service';
import { EncryptionService } from './encryption.service';
import { TokenService } from './token.service';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';
import { validateEmail, validatePassword } from '../utils/validation';

export class AuthService {
  private userModel: UserModel;
  private sessionService: SessionService;
  private encryptionService: EncryptionService;
  private tokenService: TokenService;

  constructor() {
    this.userModel = new UserModel();
    this.sessionService = new SessionService();
    this.encryptionService = new EncryptionService();
    this.tokenService = new TokenService();
  }

  async register(userData: any): Promise<{ user: any; tokens: any }> {
    try {
      if (!validateEmail(userData.email)) {
        throw new AppError('Invalid email format', 400);
      }

      const passwordValidation = validatePassword(userData.password);
      if (!passwordValidation.valid) {
        throw new AppError(passwordValidation.errors.join(', '), 400);
      }

      const existingUser = await this.userModel.findByEmail(userData.email);
      if (existingUser) {
        throw new AppError('Email already registered', 409);
      }

      const hashedPassword = await this.encryptionService.hashPassword(userData.password);

      const user = await this.userModel.create({
        ...userData,
        password: hashedPassword,
        isVerified: false,
        role: 'user'
      });

      const tokens = await this.tokenService.generateTokens(user.id, user.email, user.role);

      logger.info(`User registered: ${user.email}`);
      return { user, tokens };
    } catch (error) {
      logger.error('Error during registration:', error);
      throw error;
    }
  }

  async login(email: string, password: string, userAgent: string, ipAddress: string): Promise<any> {
    try {
      const user = await this.userModel.findByEmail(email);
      
      if (!user) {
        throw new AppError('Invalid credentials', 401);
      }

      const isValidPassword = await this.encryptionService.comparePassword(password, user.password);
      
      if (!isValidPassword) {
        throw new AppError('Invalid credentials', 401);
      }

      if (!user.isVerified) {
        throw new AppError('Email not verified', 403);
      }

      const session = await this.sessionService.createSession(user.id, userAgent, ipAddress);
      const tokens = await this.tokenService.generateTokens(user.id, user.email, user.role);

      logger.info(`User logged in: ${user.email}`);
      return { user, tokens, session };
    } catch (error) {
      logger.error('Error during login:', error);
      throw error;
    }
  }

  async logout(sessionId: string, userId: string): Promise<void> {
    try {
      await this.sessionService.deleteSession(sessionId, userId);
      logger.info(`User logged out: ${userId}`);
    } catch (error) {
      logger.error('Error during logout:', error);
      throw error;
    }
  }

  async refreshToken(refreshToken: string): Promise<any> {
    try {
      const decoded = await this.tokenService.verifyRefreshToken(refreshToken);
      const user = await this.userModel.findById(decoded.userId);

      if (!user) {
        throw new AppError('User not found', 404);
      }

      const tokens = await this.tokenService.generateTokens(user.id, user.email, user.role);

      logger.info(`Token refreshed for user: ${user.email}`);
      return tokens;
    } catch (error) {
      logger.error('Error refreshing token:', error);
      throw error;
    }
  }

  async verifyEmail(token: string): Promise<void> {
    try {
      const decoded = await this.tokenService.verifyEmailToken(token);
      await this.userModel.update(decoded.userId, { isVerified: true });

      logger.info(`Email verified for user: ${decoded.userId}`);
    } catch (error) {
      logger.error('Error verifying email:', error);
      throw error;
    }
  }

  async forgotPassword(email: string): Promise<void> {
    try {
      const user = await this.userModel.findByEmail(email);
      
      if (!user) {
        return;
      }

      const resetToken = await this.tokenService.generatePasswordResetToken(user.id);

      logger.info(`Password reset requested for: ${email}`);
    } catch (error) {
      logger.error('Error in forgot password:', error);
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.valid) {
        throw new AppError(passwordValidation.errors.join(', '), 400);
      }

      const decoded = await this.tokenService.verifyPasswordResetToken(token);
      const hashedPassword = await this.encryptionService.hashPassword(newPassword);

      await this.userModel.update(decoded.userId, { password: hashedPassword });

      logger.info(`Password reset for user: ${decoded.userId}`);
    } catch (error) {
      logger.error('Error resetting password:', error);
      throw error;
    }
  }
}
