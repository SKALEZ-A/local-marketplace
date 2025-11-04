import { InfluxDB, Point } from '@influxdata/influxdb-client';
import { EventModel } from '../models/event.model';
import { MetricModel } from '../models/metric.model';
import { logger } from '../utils/logger';
import { AppError } from '../utils/appError';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';
import _ from 'lodash';

export class AnalyticsService {
  private influxDB: InfluxDB;
  private writeApi: any;
  private queryApi: any;

  constructor() {
    this.influxDB = new InfluxDB({
      url: process.env.INFLUX_URL || 'http://localhost:8086',
      token: process.env.INFLUX_TOKEN || ''
    });

    this.writeApi = this.influxDB.getWriteApi(
      process.env.INFLUX_ORG || 'marketplace',
      process.env.INFLUX_BUCKET || 'analytics'
    );

    this.queryApi = this.influxDB.getQueryApi(process.env.INFLUX_ORG || 'marketplace');
  }

  async trackEvent(eventData: {
    eventType: string;
    userId?: string;
    sessionId?: string;
    properties?: any;
    timestamp?: Date;
  }) {
    try {
      // Store in MongoDB for detailed analysis
      const event = await EventModel.create({
        eventType: eventData.eventType,
        userId: eventData.userId,
        sessionId: eventData.sessionId,
        properties: eventData.properties || {},
        timestamp: eventData.timestamp || new Date()
      });

      // Store in InfluxDB for time-series analysis
      const point = new Point(eventData.eventType)
        .tag('userId', eventData.userId || 'anonymous')
        .tag('sessionId', eventData.sessionId || 'unknown')
        .timestamp(eventData.timestamp || new Date());

      if (eventData.properties) {
        Object.entries(eventData.properties).forEach(([key, value]) => {
          if (typeof value === 'number') {
            point.floatField(key, value);
          } else if (typeof value === 'string') {
            point.stringField(key, value);
          } else if (typeof value === 'boolean') {
            point.booleanField(key, value);
          }
        });
      }

      this.writeApi.writePoint(point);
      await this.writeApi.flush();

      logger.info(`Event tracked: ${eventData.eventType}`);

      return event;
    } catch (error: any) {
      logger.error('Event tracking failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async trackPageView(data: {
    userId?: string;
    sessionId: string;
    path: string;
    referrer?: string;
    userAgent?: string;
    duration?: number;
  }) {
    return await this.trackEvent({
      eventType: 'page_view',
      userId: data.userId,
      sessionId: data.sessionId,
      properties: {
        path: data.path,
        referrer: data.referrer,
        userAgent: data.userAgent,
        duration: data.duration
      }
    });
  }

  async trackProductView(data: {
    userId?: string;
    sessionId: string;
    productId: string;
    productName: string;
    category: string;
    price: number;
  }) {
    return await this.trackEvent({
      eventType: 'product_view',
      userId: data.userId,
      sessionId: data.sessionId,
      properties: {
        productId: data.productId,
        productName: data.productName,
        category: data.category,
        price: data.price
      }
    });
  }

  async trackAddToCart(data: {
    userId?: string;
    sessionId: string;
    productId: string;
    quantity: number;
    price: number;
  }) {
    return await this.trackEvent({
      eventType: 'add_to_cart',
      userId: data.userId,
      sessionId: data.sessionId,
      properties: {
        productId: data.productId,
        quantity: data.quantity,
        price: data.price,
        totalValue: data.quantity * data.price
      }
    });
  }

  async trackRemoveFromCart(data: {
    userId?: string;
    sessionId: string;
    productId: string;
    quantity: number;
  }) {
    return await this.trackEvent({
      eventType: 'remove_from_cart',
      userId: data.userId,
      sessionId: data.sessionId,
      properties: {
        productId: data.productId,
        quantity: data.quantity
      }
    });
  }

  async trackCheckoutStarted(data: {
    userId?: string;
    sessionId: string;
    cartValue: number;
    itemCount: number;
  }) {
    return await this.trackEvent({
      eventType: 'checkout_started',
      userId: data.userId,
      sessionId: data.sessionId,
      properties: {
        cartValue: data.cartValue,
        itemCount: data.itemCount
      }
    });
  }

  async trackPurchase(data: {
    userId?: string;
    sessionId: string;
    orderId: string;
    revenue: number;
    tax: number;
    shipping: number;
    currency: string;
    items: any[];
  }) {
    return await this.trackEvent({
      eventType: 'purchase',
      userId: data.userId,
      sessionId: data.sessionId,
      properties: {
        orderId: data.orderId,
        revenue: data.revenue,
        tax: data.tax,
        shipping: data.shipping,
        total: data.revenue + data.tax + data.shipping,
        currency: data.currency,
        itemCount: data.items.length,
        items: data.items
      }
    });
  }

  async trackSearch(data: {
    userId?: string;
    sessionId: string;
    query: string;
    resultsCount: number;
    filters?: any;
  }) {
    return await this.trackEvent({
      eventType: 'search',
      userId: data.userId,
      sessionId: data.sessionId,
      properties: {
        query: data.query,
        resultsCount: data.resultsCount,
        filters: data.filters
      }
    });
  }

  async trackUserSignup(data: {
    userId: string;
    method: string;
    source?: string;
  }) {
    return await this.trackEvent({
      eventType: 'user_signup',
      userId: data.userId,
      properties: {
        method: data.method,
        source: data.source
      }
    });
  }

  async trackUserLogin(data: {
    userId: string;
    method: string;
  }) {
    return await this.trackEvent({
      eventType: 'user_login',
      userId: data.userId,
      properties: {
        method: data.method
      }
    });
  }

  async getEventsByType(eventType: string, startDate: Date, endDate: Date) {
    try {
      const events = await EventModel.find({
        eventType,
        timestamp: {
          $gte: startDate,
          $lte: endDate
        }
      }).sort({ timestamp: -1 });

      return events;
    } catch (error: any) {
      logger.error('Events retrieval failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async getEventsByUser(userId: string, startDate: Date, endDate: Date) {
    try {
      const events = await EventModel.find({
        userId,
        timestamp: {
          $gte: startDate,
          $lte: endDate
        }
      }).sort({ timestamp: -1 });

      return events;
    } catch (error: any) {
      logger.error('User events retrieval failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async getEventsBySession(sessionId: string) {
    try {
      const events = await EventModel.find({ sessionId }).sort({ timestamp: 1 });
      return events;
    } catch (error: any) {
      logger.error('Session events retrieval failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async getDailyActiveUsers(startDate: Date, endDate: Date) {
    try {
      const result = await EventModel.aggregate([
        {
          $match: {
            timestamp: {
              $gte: startDate,
              $lte: endDate
            },
            userId: { $exists: true, $ne: null }
          }
        },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
              userId: '$userId'
            }
          }
        },
        {
          $group: {
            _id: '$_id.date',
            count: { $sum: 1 }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ]);

      return result.map(item => ({
        date: item._id,
        activeUsers: item.count
      }));
    } catch (error: any) {
      logger.error('DAU calculation failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async getConversionFunnel(startDate: Date, endDate: Date) {
    try {
      const stages = [
        'product_view',
        'add_to_cart',
        'checkout_started',
        'purchase'
      ];

      const funnelData = await Promise.all(
        stages.map(async (stage) => {
          const count = await EventModel.countDocuments({
            eventType: stage,
            timestamp: {
              $gte: startDate,
              $lte: endDate
            }
          });

          return {
            stage,
            count
          };
        })
      );

      // Calculate conversion rates
      const funnelWithRates = funnelData.map((item, index) => {
        const conversionRate = index === 0
          ? 100
          : (item.count / funnelData[0].count) * 100;

        const dropoffRate = index === 0
          ? 0
          : ((funnelData[index - 1].count - item.count) / funnelData[index - 1].count) * 100;

        return {
          ...item,
          conversionRate: conversionRate.toFixed(2),
          dropoffRate: dropoffRate.toFixed(2)
        };
      });

      return funnelWithRates;
    } catch (error: any) {
      logger.error('Conversion funnel calculation failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async getTopProducts(startDate: Date, endDate: Date, limit: number = 10) {
    try {
      const result = await EventModel.aggregate([
        {
          $match: {
            eventType: 'product_view',
            timestamp: {
              $gte: startDate,
              $lte: endDate
            }
          }
        },
        {
          $group: {
            _id: '$properties.productId',
            views: { $sum: 1 },
            productName: { $first: '$properties.productName' },
            category: { $first: '$properties.category' }
          }
        },
        {
          $sort: { views: -1 }
        },
        {
          $limit: limit
        }
      ]);

      return result.map(item => ({
        productId: item._id,
        productName: item.productName,
        category: item.category,
        views: item.views
      }));
    } catch (error: any) {
      logger.error('Top products calculation failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async getTopSearchQueries(startDate: Date, endDate: Date, limit: number = 10) {
    try {
      const result = await EventModel.aggregate([
        {
          $match: {
            eventType: 'search',
            timestamp: {
              $gte: startDate,
              $lte: endDate
            }
          }
        },
        {
          $group: {
            _id: '$properties.query',
            count: { $sum: 1 },
            avgResults: { $avg: '$properties.resultsCount' }
          }
        },
        {
          $sort: { count: -1 }
        },
        {
          $limit: limit
        }
      ]);

      return result.map(item => ({
        query: item._id,
        searchCount: item.count,
        avgResults: Math.round(item.avgResults)
      }));
    } catch (error: any) {
      logger.error('Top search queries calculation failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async getRevenueMetrics(startDate: Date, endDate: Date) {
    try {
      const result = await EventModel.aggregate([
        {
          $match: {
            eventType: 'purchase',
            timestamp: {
              $gte: startDate,
              $lte: endDate
            }
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$properties.revenue' },
            totalTax: { $sum: '$properties.tax' },
            totalShipping: { $sum: '$properties.shipping' },
            totalOrders: { $sum: 1 },
            avgOrderValue: { $avg: '$properties.total' }
          }
        }
      ]);

      if (result.length === 0) {
        return {
          totalRevenue: 0,
          totalTax: 0,
          totalShipping: 0,
          totalOrders: 0,
          avgOrderValue: 0
        };
      }

      return {
        totalRevenue: result[0].totalRevenue,
        totalTax: result[0].totalTax,
        totalShipping: result[0].totalShipping,
        totalOrders: result[0].totalOrders,
        avgOrderValue: result[0].avgOrderValue
      };
    } catch (error: any) {
      logger.error('Revenue metrics calculation failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async getUserRetention(cohortDate: Date, periods: number = 12) {
    try {
      const cohortStart = startOfDay(cohortDate);
      const cohortEnd = endOfDay(cohortDate);

      // Get users who signed up in the cohort period
      const cohortUsers = await EventModel.distinct('userId', {
        eventType: 'user_signup',
        timestamp: {
          $gte: cohortStart,
          $lte: cohortEnd
        }
      });

      const retentionData = [];

      for (let i = 0; i < periods; i++) {
        const periodStart = startOfDay(subDays(new Date(), i * 7));
        const periodEnd = endOfDay(subDays(new Date(), (i - 1) * 7));

        const activeUsers = await EventModel.distinct('userId', {
          userId: { $in: cohortUsers },
          timestamp: {
            $gte: periodStart,
            $lte: periodEnd
          }
        });

        retentionData.push({
          period: i,
          activeUsers: activeUsers.length,
          retentionRate: ((activeUsers.length / cohortUsers.length) * 100).toFixed(2)
        });
      }

      return {
        cohortSize: cohortUsers.length,
        cohortDate: format(cohortDate, 'yyyy-MM-dd'),
        retention: retentionData
      };
    } catch (error: any) {
      logger.error('User retention calculation failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async getSessionMetrics(startDate: Date, endDate: Date) {
    try {
      const sessions = await EventModel.aggregate([
        {
          $match: {
            timestamp: {
              $gte: startDate,
              $lte: endDate
            }
          }
        },
        {
          $group: {
            _id: '$sessionId',
            events: { $sum: 1 },
            startTime: { $min: '$timestamp' },
            endTime: { $max: '$timestamp' }
          }
        },
        {
          $project: {
            events: 1,
            duration: {
              $divide: [
                { $subtract: ['$endTime', '$startTime'] },
                1000 // Convert to seconds
              ]
            }
          }
        },
        {
          $group: {
            _id: null,
            totalSessions: { $sum: 1 },
            avgEventsPerSession: { $avg: '$events' },
            avgSessionDuration: { $avg: '$duration' }
          }
        }
      ]);

      if (sessions.length === 0) {
        return {
          totalSessions: 0,
          avgEventsPerSession: 0,
          avgSessionDuration: 0
        };
      }

      return {
        totalSessions: sessions[0].totalSessions,
        avgEventsPerSession: Math.round(sessions[0].avgEventsPerSession),
        avgSessionDuration: Math.round(sessions[0].avgSessionDuration)
      };
    } catch (error: any) {
      logger.error('Session metrics calculation failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async getTrafficSources(startDate: Date, endDate: Date) {
    try {
      const result = await EventModel.aggregate([
        {
          $match: {
            eventType: 'page_view',
            timestamp: {
              $gte: startDate,
              $lte: endDate
            }
          }
        },
        {
          $group: {
            _id: '$properties.referrer',
            visits: { $sum: 1 }
          }
        },
        {
          $sort: { visits: -1 }
        }
      ]);

      return result.map(item => ({
        source: item._id || 'Direct',
        visits: item.visits
      }));
    } catch (error: any) {
      logger.error('Traffic sources calculation failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async close() {
    await this.writeApi.close();
  }
}
