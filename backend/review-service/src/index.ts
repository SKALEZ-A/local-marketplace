import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createClient } from 'redis';
import mongoose from 'mongoose';
import reviewRoutes from './routes/review.routes';
import ratingRoutes from './routes/rating.routes';
import { errorHandler } from './middleware/error.middleware';
import { logger } from './utils/logger';
import { connectRabbitMQ, consumeEvents } from './config/rabbitmq';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3010;

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
  res.status(200).json({ status: 'healthy', service: 'review-service' });
});

// Routes
app.use('/api/reviews', reviewRoutes);
app.use('/api/ratings', ratingRoutes);

// Error handling
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    await redisClient.connect();
    logger.info('Redis connected');

    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/reviews');
    logger.info('MongoDB connected');

    await connectRabbitMQ();
    logger.info('RabbitMQ connected');

    // Start consuming events
    await consumeEvents();

    app.listen(PORT, () => {
      logger.info(`Review service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start review service:', error);
    process.exit(1);
  }
};

startServer();

export default app;
