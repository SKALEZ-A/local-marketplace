import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { publishEvent } from '../config/rabbitmq';
import { redisClient } from '../config/redis';
import { AppError } from '../utils/appError';
import { generateOrderNumber } from '../utils/helpers';
import { sendEmail } from '../utils/email';
import logger from '../utils/logger';

const prisma = new PrismaClient();

export const createOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { items, deliveryAddress, paymentMethod, discountCode } = req.body;
    const buyerId = req.user?.userId;

    // Calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await fetch(`${process.env.PRODUCT_SERVICE_URL}/api/products/${item.productId}`);
      const productData = await product.json();

      if (!productData.success) {
        throw new AppError(`Product ${item.productId} not found`, 404);
      }

      const itemTotal = productData.data.product.price * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        productId: item.productId,
        sellerId: productData.data.product.seller.id,
        productName: productData.data.product.title,
        quantity: item.quantity,
        unitPrice: productData.data.product.price,
        totalPrice: itemTotal,
        variantId: item.variantId
      });
    }

    // Calculate tax (example: 8%)
    const tax = subtotal * 0.08;

    // Calculate delivery fee
    const deliveryFee = subtotal > 50 ? 0 : 5.99;

    // Apply discount
    let discount = 0;
    if (discountCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: discountCode, isActive: true }
      });

      if (coupon && new Date() < coupon.expiryDate) {
        if (coupon.type === 'percentage') {
          discount = subtotal * (coupon.value / 100);
        } else {
          discount = coupon.value;
        }
      }
    }

    const total = subtotal + tax + deliveryFee - discount;

    // Generate order number
    const orderNumber = generateOrderNumber();

    // Create order
    const order = await prisma.order.create({
      data: {
        orderNumber,
        buyerId,
        status: 'pending',
        subtotal,
        tax,
        deliveryFee,
        discount,
        total,
        currency: 'USD',
        paymentMethod,
        deliveryAddress,
        items: {
          create: orderItems
        }
      },
      include: {
        items: true
      }
    });

    // Reserve inventory
    for (const item of items) {
      await fetch(`${process.env.INVENTORY_SERVICE_URL}/api/inventory/reserve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: item.productId,
          quantity: item.quantity,
          orderId: order.id
        })
      });
    }

    // Publish order created event
    await publishEvent('order.created', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      buyerId,
      total: order.total,
      items: orderItems
    });

    // Send confirmation email
    const user = await prisma.user.findUnique({ where: { id: buyerId } });
    if (user) {
      await sendEmail({
        to: user.email,
        subject: `Order Confirmation - ${orderNumber}`,
        template: 'order-confirmation',
        data: {
          firstName: user.firstName,
          orderNumber,
          total: total.toFixed(2),
          items: orderItems
        }
      });
    }

    // Clear cart
    await redisClient.del(`cart:${buyerId}`);

    logger.info(`Order created: ${order.id}`);

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: { order }
    });
  } catch (error) {
    next(error);
  }
};

export const getOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { page = 1, limit = 20, status } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = { buyerId: userId };
    if (status) {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.order.count({ where })
    ]);

    res.status(200).json({
      success: true,
      data: {
        orders,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getOrderById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        statusHistory: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    // Check ownership
    if (order.buyerId !== userId) {
      throw new AppError('Unauthorized', 403);
    }

    res.status(200).json({
      success: true,
      data: { order }
    });
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const order = await prisma.order.findUnique({ where: { id } });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    // Validate status transition
    const validTransitions: Record<string, string[]> = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['processing', 'cancelled'],
      processing: ['shipped'],
      shipped: ['delivered'],
      delivered: ['completed'],
      cancelled: []
    };

    if (!validTransitions[order.status]?.includes(status)) {
      throw new AppError(`Invalid status transition from ${order.status} to ${status}`, 400);
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status },
      include: { items: true }
    });

    // Create status history
    await prisma.orderStatusHistory.create({
      data: {
        orderId: id,
        status,
        notes
      }
    });

    // Publish status update event
    await publishEvent('order.status_updated', {
      orderId: id,
      orderNumber: order.orderNumber,
      oldStatus: order.status,
      newStatus: status,
      buyerId: order.buyerId
    });

    // Send notification
    const user = await prisma.user.findUnique({ where: { id: order.buyerId } });
    if (user) {
      await sendEmail({
        to: user.email,
        subject: `Order ${status.toUpperCase()} - ${order.orderNumber}`,
        template: 'order-status-update',
        data: {
          firstName: user.firstName,
          orderNumber: order.orderNumber,
          status,
          notes
        }
      });
    }

    logger.info(`Order status updated: ${id} -> ${status}`);

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      data: { order: updatedOrder }
    });
  } catch (error) {
    next(error);
  }
};

export const cancelOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user?.userId;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    // Check ownership
    if (order.buyerId !== userId) {
      throw new AppError('Unauthorized', 403);
    }

    // Check if order can be cancelled
    if (!['pending', 'confirmed'].includes(order.status)) {
      throw new AppError('Order cannot be cancelled at this stage', 400);
    }

    // Update order status
    await prisma.order.update({
      where: { id },
      data: { status: 'cancelled' }
    });

    // Create status history
    await prisma.orderStatusHistory.create({
      data: {
        orderId: id,
        status: 'cancelled',
        notes: reason
      }
    });

    // Release inventory
    for (const item of order.items) {
      await fetch(`${process.env.INVENTORY_SERVICE_URL}/api/inventory/release`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: item.productId,
          quantity: item.quantity,
          orderId: order.id
        })
      });
    }

    // Initiate refund if payment was made
    if (order.paymentStatus === 'completed') {
      await fetch(`${process.env.PAYMENT_SERVICE_URL}/api/payments/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          amount: order.total,
          reason
        })
      });
    }

    // Publish cancellation event
    await publishEvent('order.cancelled', {
      orderId: id,
      orderNumber: order.orderNumber,
      buyerId: order.buyerId,
      reason
    });

    logger.info(`Order cancelled: ${id}`);

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const getOrderTracking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        statusHistory: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    // Check ownership
    if (order.buyerId !== userId) {
      throw new AppError('Unauthorized', 403);
    }

    // Get delivery tracking if available
    let deliveryTracking = null;
    if (order.status === 'shipped' || order.status === 'delivered') {
      const response = await fetch(`${process.env.DELIVERY_SERVICE_URL}/api/delivery/track/${id}`);
      if (response.ok) {
        const data = await response.json();
        deliveryTracking = data.data;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          estimatedDelivery: order.estimatedDelivery,
          statusHistory: order.statusHistory
        },
        deliveryTracking
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getSellerOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sellerId = req.user?.userId;
    const { page = 1, limit = 20, status } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      items: {
        some: {
          sellerId
        }
      }
    };

    if (status) {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: {
            where: { sellerId }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.order.count({ where })
    ]);

    res.status(200).json({
      success: true,
      data: {
        orders,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
