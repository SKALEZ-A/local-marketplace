import amqp from 'amqplib';
import { logger } from './logger';

let connection: amqp.Connection | null = null;
let channel: amqp.Channel | null = null;

export const connectQueue = async (): Promise<void> => {
  try {
    const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://localhost';
    connection = await amqp.connect(rabbitmqUrl);
    channel = await connection.createChannel();
    
    logger.info('RabbitMQ connected successfully');
  } catch (error) {
    logger.error('Failed to connect to RabbitMQ:', error);
    throw error;
  }
};

export const publishMessage = async (queue: string, message: any): Promise<void> => {
  try {
    if (!channel) {
      await connectQueue();
    }

    await channel!.assertQueue(queue, { durable: true });
    channel!.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
      persistent: true
    });

    logger.info(`Message published to queue ${queue}`);
  } catch (error) {
    logger.error('Error publishing message:', error);
    throw error;
  }
};

export const consumeMessages = async (
  queue: string,
  callback: (message: any) => Promise<void>
): Promise<void> => {
  try {
    if (!channel) {
      await connectQueue();
    }

    await channel!.assertQueue(queue, { durable: true });
    channel!.prefetch(1);

    channel!.consume(queue, async (msg) => {
      if (msg) {
        try {
          const content = JSON.parse(msg.content.toString());
          await callback(content);
          channel!.ack(msg);
        } catch (error) {
          logger.error('Error processing message:', error);
          channel!.nack(msg, false, false);
        }
      }
    });

    logger.info(`Consuming messages from queue ${queue}`);
  } catch (error) {
    logger.error('Error consuming messages:', error);
    throw error;
  }
};

export const closeQueue = async (): Promise<void> => {
  try {
    if (channel) {
      await channel.close();
    }
    if (connection) {
      await connection.close();
    }
    logger.info('RabbitMQ connection closed');
  } catch (error) {
    logger.error('Error closing RabbitMQ connection:', error);
  }
};
