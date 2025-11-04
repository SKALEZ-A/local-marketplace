export interface Session {
  id: string;
  userId: string;
  userAgent: string;
  ipAddress: string;
  expiresAt: Date;
  createdAt: Date;
  lastActivity: Date;
}

export interface SessionInfo {
  sessionId: string;
  device: string;
  browser: string;
  os: string;
  location: string;
  ipAddress: string;
  current: boolean;
  lastActivity: Date;
  createdAt: Date;
}

export interface SessionActivity {
  sessionId: string;
  userId: string;
  action: string;
  resource: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}
