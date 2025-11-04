export interface PageView {
  userId?: string;
  sessionId: string;
  page: string;
  referrer?: string;
  timestamp: Date;
  duration?: number;
}

export interface Event {
  userId?: string;
  sessionId: string;
  eventType: string;
  eventData: Record<string, any>;
  timestamp: Date;
}

export interface UserMetrics {
  userId: string;
  totalViews: number;
  totalPurchases: number;
  totalSpent: number;
  averageOrderValue: number;
  lastActive: Date;
}

export class AnalyticsModel {
  private pageViews: PageView[] = [];
  private events: Event[] = [];
  private userMetrics: Map<string, UserMetrics> = new Map();

  async trackPageView(data: PageView): Promise<void> {
    this.pageViews.push(data);
  }

  async trackEvent(data: Event): Promise<void> {
    this.events.push(data);
  }

  async getUserMetrics(userId: string): Promise<UserMetrics | null> {
    return this.userMetrics.get(userId) || null;
  }

  async updateUserMetrics(userId: string, data: Partial<UserMetrics>): Promise<void> {
    const existing = this.userMetrics.get(userId);
    const updated: UserMetrics = {
      userId,
      totalViews: data.totalViews ?? existing?.totalViews ?? 0,
      totalPurchases: data.totalPurchases ?? existing?.totalPurchases ?? 0,
      totalSpent: data.totalSpent ?? existing?.totalSpent ?? 0,
      averageOrderValue: data.averageOrderValue ?? existing?.averageOrderValue ?? 0,
      lastActive: data.lastActive ?? new Date()
    };
    this.userMetrics.set(userId, updated);
  }
}
