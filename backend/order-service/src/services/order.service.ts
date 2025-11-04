import { Order } from '../models/order.model';
import { AppError } from '../utils/appError';
import { generateOrderNumber } from '../utils/orderNumber';
import { CartService } from './cart.service';
import axios from 'axios';

export class OrderService {
  private cartService: CartService;

  constructor() {
    this.cartService = new CartService();
  }

  async createOrder(userId: string, orderData: any) {
    const cart = await this.cartService.getCart(userId);
    
    if (cart.items.length === 0) {
      throw new AppError('Cart is empty', 400);
    }

    const orderNumber = generateOrderNumber();
    const summary = await this.cartService.getCartSummary(userId);

    const order = await Order.create({
      orderNumber,
      user: userId,
      items: cart.items,
      shippingAddress: orderData.shippingAddress,
      billingAddress: orderData.billingAddress || orderData.shippingAddress,
      payment: {
        method: orderData.paymentMethod,
        status: 'pending'
      },
      subtotal: summary.subtotal,
      tax: summary.tax,
      shipping: summary.shipping,
      discount: summary.discount,
      total: summary.total,
      notes: orderData.notes
    });

    await this.cartService.clearCart(userId);

    await this.notifyServices(order);

    return order;
  }

  async getOrders(userId: string, options: any = {}) {
    const { page = 1, limit = 20, status } = options;
    const query: any = { user: userId };

    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate('items.product')
      .limit(limit)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Order.countDocuments(query);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getOrderById(orderId: string, userId?: string) {
    const query: any = { _id: orderId };
    if (userId) {
      query.user = userId;
    }

    const order = await Order.findOne(query).populate('items.product');
    
    if (!order) {
      throw new AppError('Order not found', 404);
    }

    return order;
  }

  async updateOrderStatus(orderId: string, status: string) {
    const order = await Order.findByIdAndUpdate(
      orderId,
      { $set: { status } },
      { new: true }
    );

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    await this.sendStatusNotification(order);

    return order;
  }

  async cancelOrder(orderId: string, userId: string) {
    const order = await this.getOrderById(orderId, userId);

    if (order.status === 'delivered' || order.status === 'cancelled') {
      throw new AppError('Cannot cancel this order', 400);
    }

    order.status = 'cancelled';
    await order.save();

    await this.processRefund(order);

    return order;
  }

  private async notifyServices(order: any) {
    try {
      await axios.post(`${process.env.PAYMENT_SERVICE_URL}/process`, {
        orderId: order._id,
        amount: order.total,
        method: order.payment.method
      });

      await axios.post(`${process.env.NOTIFICATION_SERVICE_URL}/send`, {
        userId: order.user,
        type: 'order_confirmation',
        data: { orderNumber: order.orderNumber }
      });
    } catch (error) {
      console.error('Error notifying services:', error);
    }
  }

  private async sendStatusNotification(order: any) {
    try {
      await axios.post(`${process.env.NOTIFICATION_SERVICE_URL}/send`, {
        userId: order.user,
        type: 'order_status_update',
        data: {
          orderNumber: order.orderNumber,
          status: order.status
        }
      });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  private async processRefund(order: any) {
    try {
      if (order.payment.status === 'completed') {
        await axios.post(`${process.env.PAYMENT_SERVICE_URL}/refund`, {
          orderId: order._id,
          amount: order.total,
          transactionId: order.payment.transactionId
        });
      }
    } catch (error) {
      console.error('Error processing refund:', error);
    }
  }
}
