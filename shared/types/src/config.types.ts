export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  poolSize?: number;
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  ttl?: number;
}

export interface RabbitMQConfig {
  url: string;
  exchange?: string;
  queues?: string[];
  prefetch?: number;
}

export interface JWTConfig {
  secret: string;
  accessTokenExpiry: string;
  refreshTokenExpiry: string;
  issuer: string;
  audience: string;
}

export interface EmailConfig {
  provider: 'smtp' | 'sendgrid' | 'ses';
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  apiKey?: string;
  from: string;
  fromName: string;
}

export interface StorageConfig {
  provider: 's3' | 'gcs' | 'azure' | 'local';
  bucket?: string;
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  localPath?: string;
}

export interface PaymentConfig {
  stripe?: {
    publicKey: string;
    secretKey: string;
    webhookSecret: string;
  };
  paypal?: {
    clientId: string;
    clientSecret: string;
    mode: 'sandbox' | 'live';
  };
  square?: {
    applicationId: string;
    accessToken: string;
    locationId: string;
  };
}

export interface ServiceConfig {
  name: string;
  port: number;
  host: string;
  environment: 'development' | 'staging' | 'production';
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  corsOrigins: string[];
  rateLimitWindow: number;
  rateLimitMax: number;
}
