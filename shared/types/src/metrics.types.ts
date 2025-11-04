export interface ServiceMetrics {
  serviceName: string;
  uptime: number;
  requestCount: number;
  errorCount: number;
  averageResponseTime: number;
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  };
  cpuUsage: {
    user: number;
    system: number;
  };
  timestamp: Date;
}

export interface RequestMetrics {
  method: string;
  path: string;
  statusCode: number;
  responseTime: number;
  timestamp: Date;
  userId?: string;
  userAgent?: string;
  ipAddress?: string;
}

export interface ErrorMetrics {
  errorType: string;
  errorMessage: string;
  stackTrace?: string;
  path: string;
  method: string;
  timestamp: Date;
  userId?: string;
}

export interface BusinessMetrics {
  totalOrders: number;
  totalRevenue: number;
  totalUsers: number;
  activeUsers: number;
  conversionRate: number;
  averageOrderValue: number;
  period: string;
  timestamp: Date;
}
