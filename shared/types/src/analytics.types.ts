export interface AnalyticsEvent {
  timestamp: Date;
  userId?: string;
  sessionId: string;
  eventType: EventType;
  eventData: Record<string, any>;
  device: DeviceInfo;
  location?: LocationInfo;
}

export type EventType =
  | 'page_view'
  | 'product_view'
  | 'product_click'
  | 'search'
  | 'add_to_cart'
  | 'remove_from_cart'
  | 'checkout_start'
  | 'purchase'
  | 'review_submit'
  | 'share';

export interface DeviceInfo {
  type: 'desktop' | 'mobile' | 'tablet';
  os: string;
  browser: string;
  userAgent: string;
}

export interface LocationInfo {
  country: string;
  region: string;
  city: string;
  ipAddress: string;
}

export interface DashboardMetrics {
  sales: SalesMetrics;
  products: ProductMetrics;
  customers: CustomerMetrics;
  revenue: RevenueMetrics;
}

export interface SalesMetrics {
  totalSales: number;
  salesGrowth: number;
  averageOrderValue: number;
  conversionRate: number;
}

export interface ProductMetrics {
  totalProducts: number;
  activeProducts: number;
  outOfStock: number;
  topProducts: TopProduct[];
}

export interface TopProduct {
  productId: string;
  name: string;
  sales: number;
  revenue: number;
}

export interface CustomerMetrics {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  customerRetentionRate: number;
}

export interface RevenueMetrics {
  totalRevenue: number;
  revenueGrowth: number;
  projectedRevenue: number;
  revenueByCategory: CategoryRevenue[];
}

export interface CategoryRevenue {
  category: string;
  revenue: number;
  percentage: number;
}

export interface FunnelAnalytics {
  stages: FunnelStage[];
  overallConversion: number;
}

export interface FunnelStage {
  name: string;
  count: number;
  conversionRate: number;
  dropoffRate: number;
}
