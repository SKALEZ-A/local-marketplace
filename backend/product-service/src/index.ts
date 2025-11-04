import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import productRoutes from './routes/product.routes';
import categoryRoutes from './routes/category.routes';
import { errorHandler } from './middleware/error.middleware';
import { connectMongoDB } from './config/database';
import { connectRedis } from './config/redis';
import { connectRabbitMQ } from './config/rabbitmq';
import logger from './utils/logger';

dotenv.config();

const app: Application = express();
const PORT = process.env.PRODUCT_SERVICE_PORT || 3002;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'product-service',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handling
app.use(errorHandler);

const startServer = async () => {
  try {
    await connectMongoDB();
    logger.info('MongoDB connected successfully');

    await connectRedis();
    logger.info('Redis connected successfully');

    await connectRabbitMQ();
    logger.info('RabbitMQ connected successfully');

    const server = createServer(app);

    server.listen(PORT, () => {
      logger.info(`Product Service running on port ${PORT}`);
    });

    process.on('SIGTERM', () => {
      logger.info('SIGTERM signal received: closing HTTP server');
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
