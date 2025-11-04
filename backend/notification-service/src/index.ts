import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createClient } from 'redis';
import Queue from 'bull';
import notificationRoutes from './routes/notification.routes';
import emailRoutes from './routes/email.routes';
import smsRoutes from './routes/sms.routes';
import pushRoutes from './routes/push.routes';
import { errorHandler } from './middleware/error.middleware';
import { logger } from './utils/logger';
import { connectRabbitMQ, consumeEvents } from './config/rabbitmq';
import { EmailWorker } from './workers/email.worker';
import { SMSWorker } from './workers/sms.worker';
import { PushWorker } from './workers/push.worker';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3005;

// Redis client
export const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

// Bull queues
export const emailQueue = new Queue('email', process.env.REDIS_URL || 'redis://localhost:6379');
export const smsQueue = new Queue('sms', process.env.REDIS_URL || 'redis://localhost:6379');
export const pushQueue = new Queue('push', process.env.REDIS_URL || 'redis://localhost:6379');

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
  res.status(200).json({ status: 'healthy', service: 'notification-service' });
});

// Routes
app.use('/api/notifications', notificationRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/sms', smsRoutes);
app.use('/api/push', pushRoutes);

// Error handling
app.use(errorHandler);

// Initialize workers
const emailWorker = new EmailWorker(emailQueue);
const smsWorker = new SMSWorker(smsQueue);
const pushWorker = new PushWorker(pushQueue);

// Start server
const startServer = async () => {
  try {
    await redisClient.connect();
    logger.info('Redis connected');

    await connectRabbitMQ();
    logger.info('RabbitMQ connected');

    // Start consuming events
    await consumeEvents();

    // Start workers
    emailWorker.start();
    smsWorker.start();
    pushWorker.start();

    app.listen(PORT, () => {
      logger.info(`Notification service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start notification service:', error);
    process.exit(1);
  }
};

startServer();

export default app;
