import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import orderRoutes from './routes/order.routes';
import cartRoutes from './routes/cart.routes';
import { errorHandler } from './middleware/error.middleware';
import { connectRedis } from './config/redis';
import { connectRabbitMQ } from './config/rabbitmq';
import logger from './utils/logger';

dotenv.config();

const app: Application = express();
const PORT = process.env.ORDER_SERVICE_PORT || 3003;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'order-service',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);

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
    await connectRedis();
    logger.info('Redis connected successfully');

    await connectRabbitMQ();
    logger.info('RabbitMQ connected successfully');

    const server = createServer(app);

    server.listen(PORT, () => {
      logger.info(`Order Service running on port ${PORT}`);
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
