import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createClient } from 'redis';
import searchRoutes from './routes/search.routes';
import indexRoutes from './routes/index.routes';
import autocompleteRoutes from './routes/autocomplete.routes';
import { errorHandler } from './middleware/error.middleware';
import { logger } from './utils/logger';
import { connectRabbitMQ, consumeEvents } from './config/rabbitmq';
import { ElasticsearchService } from './services/elasticsearch.service';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3007;

// Redis client
export const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

// Initialize Elasticsearch
export const elasticsearchService = new ElasticsearchService();

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
  res.status(200).json({ status: 'healthy', service: 'search-service' });
});

// Routes
app.use('/api/search', searchRoutes);
app.use('/api/index', indexRoutes);
app.use('/api/autocomplete', autocompleteRoutes);

// Error handling
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    await redisClient.connect();
    logger.info('Redis connected');

    await elasticsearchService.ping();
    logger.info('Elasticsearch connected');

    await connectRabbitMQ();
    logger.info('RabbitMQ connected');

    // Start consuming events for indexing
    await consumeEvents();

    app.listen(PORT, () => {
      logger.info(`Search service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start search service:', error);
    process.exit(1);
  }
};

startServer();

export default app;
