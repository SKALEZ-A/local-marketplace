import amqp, { Connection, Channel } from 'amqplib';
import logger from '../utils/logger';

let connection: Connection;
let channel: Channel;

export const connectRabbitMQ = async (): Promise<void> => {
  try {
    const rabbitMQUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
    
    connection = await amqp.connect(rabbitMQUrl);
    channel = await connection.createChannel();

    // Declare exchanges
    await channel.assertExchange('product_events', 'topic', { durable: true });
    await channel.assertExchange('search_events', 'topic', { durable: true });

    logger.info('RabbitMQ connected successfully');

    connection.on('error', (err) => {
      logger.error('RabbitMQ connection error:', err);
    });

    connection.on('close', () => {
      logger.warn('RabbitMQ connection closed');
    });

  } catch (error) {
    logger.error('Failed to connect to RabbitMQ:', error);
    throw error;
  }
};

export const publishEvent = async (routingKey: string, message: any): Promise<void> => {
  try {
    if (!channel) {
      throw new Error('RabbitMQ channel not initialized');
    }

    const exchange = routingKey.startsWith('product.') ? 'product_events' : 'search_events';
    
    channel.publish(
      exchange,
      routingKey,
      Buffer.from(JSON.stringify(message)),
      { persistent: true }
    );

    logger.info(`Event published: ${routingKey}`);
  } catch (error) {
    logger.error('Failed to publish event:', error);
    throw error;
  }
};

export const consumeEvents = async (queue: string, routingKeys: string[], handler: (msg: any) => Promise<void>): Promise<void> => {
  try {
    if (!channel) {
      throw new Error('RabbitMQ channel not initialized');
    }

    await channel.assertQueue(queue, { durable: true });

    for (const routingKey of routingKeys) {
      const exchange = routingKey.startsWith('product.') ? 'product_events' : 'search_events';
      await channel.bindQueue(queue, exchange, routingKey);
    }

    channel.consume(queue, async (msg) => {
      if (msg) {
        try {
          const content = JSON.parse(msg.content.toString());
          await handler(content);
          channel.ack(msg);
        } catch (error) {
          logger.error('Error processing message:', error);
          channel.nack(msg, false, false);
        }
      }
    });

    logger.info(`Consuming events from queue: ${queue}`);
  } catch (error) {
    logger.error('Failed to consume events:', error);
    throw error;
  }
};

export const disconnectRabbitMQ = async (): Promise<void> => {
  try {
    if (channel) await channel.close();
    if (connection) await connection.close();
    logger.info('RabbitMQ disconnected successfully');
  } catch (error) {
    logger.error('Failed to disconnect from RabbitMQ:', error);
    throw error;
  }
};
