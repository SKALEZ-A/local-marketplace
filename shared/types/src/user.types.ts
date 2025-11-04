import { Address, UserRole, SubscriptionTier } from './common.types';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  profile: UserProfile;
  addresses: Address[];
  preferences: UserPreferences;
  verification: UserVerification;
  security: UserSecurity;
  seller?: SellerProfile;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  bio?: string;
}

export interface UserPreferences {
  language: string;
  currency: string;
  notifications: NotificationPreferences;
  theme: 'light' | 'dark';
}

export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
  orderUpdates: boolean;
  promotions: boolean;
  messages: boolean;
  priceDrops: boolean;
}

export interface UserVerification {
  emailVerified: boolean;
  phoneVerified: boolean;
  kycVerified: boolean;
  kycDocuments?: string[];
}

export interface UserSecurity {
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  lastLogin?: Date;
  loginHistory: LoginRecord[];
}

export interface LoginRecord {
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  location?: string;
}

export interface SellerProfile {
  businessName: string;
  businessType: string;
  taxId?: string;
  subscriptionTier: SubscriptionTier;
  subscriptionExpiry: Date;
  rating: number;
  totalSales: number;
  totalRevenue: number;
  payoutMethod: PayoutMethod;
  bankAccount?: BankAccount;
}

export interface PayoutMethod {
  type: 'bank_transfer' | 'paypal' | 'stripe';
  details: Record<string, any>;
}

export interface BankAccount {
  accountNumber: string;
  routingNumber: string;
  accountHolderName: string;
  bankName: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface LoginInput {
  email: string;
  password: string;
  twoFactorCode?: string;
}

export interface AuthPayload {
  accessToken: string;
  refreshToken: string;
  user: User;
}
