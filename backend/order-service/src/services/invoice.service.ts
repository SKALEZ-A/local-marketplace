import { generateInvoiceNumber } from '../utils/orderNumber';
import { logger } from '../utils/logger';

export interface Invoice {
  invoiceNumber: string;
  orderId: string;
  userId: string;
  items: {
    productId: string;
    name: string;
    quantity: number;
    price: number;
    total: number;
  }[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  billingAddress: any;
  createdAt: Date;
}

export class InvoiceService {
  async generateInvoice(order: any): Promise<Invoice> {
    try {
      const invoiceNumber = generateInvoiceNumber(order.id);

      const items = order.items.map((item: any) => ({
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        total: item.quantity * item.price
      }));

      const subtotal = items.reduce((sum: number, item: any) => sum + item.total, 0);
      const tax = subtotal * 0.1; // 10% tax
      const shipping = order.shippingCost || 0;
      const total = subtotal + tax + shipping;

      const invoice: Invoice = {
        invoiceNumber,
        orderId: order.id,
        userId: order.userId,
        items,
        subtotal,
        tax,
        shipping,
        total,
        billingAddress: order.billingAddress || order.shippingAddress,
        createdAt: new Date()
      };

      logger.info(`Invoice generated: ${invoiceNumber}`);
      return invoice;
    } catch (error) {
      logger.error('Error generating invoice:', error);
      throw error;
    }
  }

  async generatePDF(invoice: Invoice): Promise<Buffer> {
    // Placeholder for PDF generation
    // In production, use a library like pdfkit or puppeteer
    const content = JSON.stringify(invoice, null, 2);
    return Buffer.from(content);
  }
}
