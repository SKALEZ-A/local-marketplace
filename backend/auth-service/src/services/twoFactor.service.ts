import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { logger } from '../utils/logger';
import { AppError } from '../utils/appError';

export interface TwoFactorSetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export class TwoFactorService {
  async generateSecret(email: string): Promise<TwoFactorSetup> {
    try {
      const secret = speakeasy.generateSecret({
        name: `LocalMarketplace (${email})`,
        length: 32
      });

      const qrCode = await QRCode.toDataURL(secret.otpauth_url!);
      const backupCodes = this.generateBackupCodes();

      return {
        secret: secret.base32,
        qrCode,
        backupCodes
      };
    } catch (error) {
      logger.error('Error generating 2FA secret:', error);
      throw new AppError('Failed to generate 2FA secret', 500);
    }
  }

  verifyToken(secret: string, token: string): boolean {
    try {
      return speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token,
        window: 2
      });
    } catch (error) {
      logger.error('Error verifying 2FA token:', error);
      return false;
    }
  }

  verifyBackupCode(storedCodes: string[], providedCode: string): boolean {
    const index = storedCodes.indexOf(providedCode);
    if (index === -1) {
      return false;
    }

    storedCodes.splice(index, 1);
    return true;
  }

  private generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  async enable2FA(userId: string, token: string, secret: string): Promise<boolean> {
    if (!this.verifyToken(secret, token)) {
      throw new AppError('Invalid verification code', 400);
    }

    logger.info(`2FA enabled for user: ${userId}`);
    return true;
  }

  async disable2FA(userId: string, password: string): Promise<boolean> {
    logger.info(`2FA disabled for user: ${userId}`);
    return true;
  }

  async regenerateBackupCodes(userId: string): Promise<string[]> {
    const backupCodes = this.generateBackupCodes();
    logger.info(`Backup codes regenerated for user: ${userId}`);
    return backupCodes;
  }
}

export const twoFactorService = new TwoFactorService();
