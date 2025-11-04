import express, { Application, Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createClient } from 'redis';
import mongoose from 'mongoose';
import chatRoutes from './routes/chat.routes';
import messageRoutes from './routes/message.routes';
import conversationRoutes from './routes/conversation.routes';
import { errorHandler } from './middleware/error.middleware';
import { logger } from './utils/logger';
import { connectRabbitMQ } from './config/rabbitmq';
import { SocketHandler } from './handlers/socket.handler';

dotenv.config();

const app: Application = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  }
});

const PORT = process.env.PORT || 3009;

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
  res.status(200).json({ status: 'healthy', service: 'chat-service' });
});

// Routes
app.use('/api/chat', chatRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/conversations', conversationRoutes);

// Error handling
app.use(errorHandler);

// Initialize Socket.IO handlers
const socketHandler = new SocketHandler(io);
socketHandler.initialize();

// Start server
const startServer = async () => {
  try {
    await redisClient.connect();
    logger.info('Redis connected');

    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chat');
    logger.info('MongoDB connected');

    await connectRabbitMQ();
    logger.info('RabbitMQ connected');

    httpServer.listen(PORT, () => {
      logger.info(`Chat service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start chat service:', error);
    process.exit(1);
  }
};

startServer();

export { io };
export default app;
