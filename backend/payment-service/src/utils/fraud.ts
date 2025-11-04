import { logger } from './logger';

export interface FraudCheckResult {
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  flags: string[];
  approved: boolean;
  requiresManualReview: boolean;
}

export interface TransactionData {
  amount: number;
  currency: string;
  userId: string;
  ipAddress: string;
  deviceId?: string;
  billingAddress: any;
  shippingAddress: any;
  email: string;
  cardBin?: string;
  userHistory?: {
    totalTransactions: number;
    totalAmount: number;
    chargebacks: number;
    accountAge: number;
  };
}

export class FraudDetectionService {
  private readonly HIGH_RISK_THRESHOLD = 70;
  private readonly MEDIUM_RISK_THRESHOLD = 40;
  private readonly CRITICAL_RISK_THRESHOLD = 90;

  async checkTransaction(data: TransactionData): Promise<FraudCheckResult> {
    const flags: string[] = [];
    let riskScore = 0;

    riskScore += this.checkAmount(data.amount, flags);
    riskScore += this.checkVelocity(data.userId, flags);
    riskScore += this.checkGeolocation(data.ipAddress, data.billingAddress, flags);
    riskScore += this.checkAddressMismatch(data.billingAddress, data.shippingAddress, flags);
    riskScore += this.checkUserHistory(data.userHistory, flags);
    riskScore += this.checkEmailDomain(data.email, flags);
    riskScore += this.checkDeviceFingerprint(data.deviceId, flags);
    riskScore += this.checkCardBin(data.cardBin, flags);

    const riskLevel = this.calculateRiskLevel(riskScore);
    const approved = riskScore < this.HIGH_RISK_THRESHOLD;
    const requiresManualReview = riskScore >= this.MEDIUM_RISK_THRESHOLD && 
                                  riskScore < this.CRITICAL_RISK_THRESHOLD;

    logger.info('Fraud check completed', {
      userId: data.userId,
      riskScore,
      riskLevel,
      flags
    });

    return {
      riskScore,
      riskLevel,
      flags,
      approved,
      requiresManualReview
    };
  }

  private checkAmount(amount: number, flags: string[]): number {
    let score = 0;

    if (amount > 10000) {
      score += 30;
      flags.push('High transaction amount');
    } else if (amount > 5000) {
      score += 15;
      flags.push('Elevated transaction amount');
    }

    if (amount % 100 === 0 && amount > 1000) {
      score += 10;
      flags.push('Round number transaction');
    }

    return score;
  }

  private checkVelocity(userId: string, flags: string[]): number {
    let score = 0;
    return score;
  }

  private checkGeolocation(
    ipAddress: string,
    billingAddress: any,
    flags: string[]
  ): number {
    let score = 0;
    return score;
  }

  private checkAddressMismatch(
    billingAddress: any,
    shippingAddress: any,
    flags: string[]
  ): number {
    let score = 0;

    if (!billingAddress || !shippingAddress) {
      return score;
    }

    if (billingAddress.country !== shippingAddress.country) {
      score += 20;
      flags.push('Billing and shipping countries differ');
    }

    if (billingAddress.city !== shippingAddress.city) {
      score += 10;
      flags.push('Billing and shipping cities differ');
    }

    return score;
  }

  private checkUserHistory(userHistory: any, flags: string[]): number {
    let score = 0;

    if (!userHistory) {
      score += 15;
      flags.push('New user account');
      return score;
    }

    if (userHistory.chargebacks > 0) {
      score += userHistory.chargebacks * 25;
      flags.push(`User has ${userHistory.chargebacks} chargeback(s)`);
    }

    if (userHistory.accountAge < 7) {
      score += 10;
      flags.push('Recently created account');
    }

    return score;
  }

  private checkEmailDomain(email: string, flags: string[]): number {
    let score = 0;

    const disposableEmailDomains = [
      'tempmail.com', 'guerrillamail.com', '10minutemail.com',
      'throwaway.email', 'mailinator.com'
    ];

    const domain = email.split('@')[1]?.toLowerCase();
    if (disposableEmailDomains.includes(domain)) {
      score += 25;
      flags.push('Disposable email address');
    }

    return score;
  }

  private checkDeviceFingerprint(deviceId: string | undefined, flags: string[]): number {
    let score = 0;

    if (!deviceId) {
      score += 10;
      flags.push('No device fingerprint');
    }

    return score;
  }

  private checkCardBin(cardBin: string | undefined, flags: string[]): number {
    let score = 0;

    if (!cardBin) {
      return score;
    }

    return score;
  }

  private calculateRiskLevel(score: number): FraudCheckResult['riskLevel'] {
    if (score >= this.CRITICAL_RISK_THRESHOLD) return 'critical';
    if (score >= this.HIGH_RISK_THRESHOLD) return 'high';
    if (score >= this.MEDIUM_RISK_THRESHOLD) return 'medium';
    return 'low';
  }

  async reportFraud(transactionId: string, reason: string): Promise<void> {
    logger.warn('Fraud reported', { transactionId, reason });
  }

  async whitelistUser(userId: string): Promise<void> {
    logger.info('User whitelisted', { userId });
  }

  async blacklistUser(userId: string, reason: string): Promise<void> {
    logger.warn('User blacklisted', { userId, reason });
  }
}

export const fraudDetectionService = new FraudDetectionService();
