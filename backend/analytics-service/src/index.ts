import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createClient } from 'redis';
import mongoose from 'mongoose';
import analyticsRoutes from './routes/analytics.routes';
import reportsRoutes from './routes/reports.routes';
import metricsRoutes from './routes/metrics.routes';
import dashboardRoutes from './routes/dashboard.routes';
import { errorHandler } from './middleware/error.middleware';
import { logger } from './utils/logger';
import { connectRabbitMQ, consumeEvents } from './config/rabbitmq';
import { connectInfluxDB } from './config/influxdb';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3006;

// Redis client
export const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'healthy', service: 'analytics-service' });
});

// Routes
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Error handling
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    await redisClient.connect();
    logger.info('Redis connected');

    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/analytics');
    logger.info('MongoDB connected');

    await connectInfluxDB();
    logger.info('InfluxDB connected');

    await connectRabbitMQ();
    logger.info('RabbitMQ connected');

    // Start consuming events
    await consumeEvents();

    app.listen(PORT, () => {
      logger.info(`Analytics service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start analytics service:', error);
    process.exit(1);
  }
};

startServer();

export default app;
