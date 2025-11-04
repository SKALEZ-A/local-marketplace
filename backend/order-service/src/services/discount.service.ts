import { logger } from '../utils/logger';
import { AppError } from '../utils/appError';

export interface Discount {
  id: string;
  code: string;
  type: 'percentage' | 'fixed' | 'bogo' | 'shipping';
  value: number;
  minPurchase?: number;
  maxDiscount?: number;
  startDate: Date;
  endDate: Date;
  usageLimit?: number;
  usageCount: number;
  applicableProducts?: string[];
  applicableCategories?: string[];
  excludedProducts?: string[];
}

export interface DiscountApplication {
  discountId: string;
  code: string;
  amount: number;
  type: string;
}

export class DiscountService {
  async validateDiscount(code: string, orderTotal: number, items: any[]): Promise<Discount> {
    const discount = await this.findDiscountByCode(code);

    if (!discount) {
      throw new AppError('Invalid discount code', 400);
    }

    const now = new Date();
    if (now < discount.startDate || now > discount.endDate) {
      throw new AppError('Discount code has expired', 400);
    }

    if (discount.usageLimit && discount.usageCount >= discount.usageLimit) {
      throw new AppError('Discount code usage limit reached', 400);
    }

    if (discount.minPurchase && orderTotal < discount.minPurchase) {
      throw new AppError(
        `Minimum purchase of $${discount.minPurchase} required`,
        400
      );
    }

    if (discount.applicableProducts && discount.applicableProducts.length > 0) {
      const hasApplicableProduct = items.some(item =>
        discount.applicableProducts!.includes(item.productId)
      );
      if (!hasApplicableProduct) {
        throw new AppError('Discount not applicable to cart items', 400);
      }
    }

    if (discount.excludedProducts && discount.excludedProducts.length > 0) {
      const hasExcludedProduct = items.some(item =>
        discount.excludedProducts!.includes(item.productId)
      );
      if (hasExcludedProduct) {
        throw new AppError('Discount cannot be applied with excluded products', 400);
      }
    }

    return discount;
  }

  calculateDiscountAmount(discount: Discount, orderTotal: number, items: any[]): number {
    let discountAmount = 0;

    switch (discount.type) {
      case 'percentage':
        discountAmount = (orderTotal * discount.value) / 100;
        break;
      
      case 'fixed':
        discountAmount = discount.value;
        break;
      
      case 'bogo':
        discountAmount = this.calculateBogoDiscount(items, discount);
        break;
      
      case 'shipping':
        discountAmount = discount.value;
        break;
      
      default:
        logger.warn(`Unknown discount type: ${discount.type}`);
    }

    if (discount.maxDiscount) {
      discountAmount = Math.min(discountAmount, discount.maxDiscount);
    }

    return Math.min(discountAmount, orderTotal);
  }

  private calculateBogoDiscount(items: any[], discount: Discount): number {
    const applicableItems = items.filter(item => {
      if (discount.applicableProducts && discount.applicableProducts.length > 0) {
        return discount.applicableProducts.includes(item.productId);
      }
      return true;
    });

    applicableItems.sort((a, b) => a.price - b.price);

    let discountAmount = 0;
    const pairs = Math.floor(applicableItems.length / 2);

    for (let i = 0; i < pairs; i++) {
      discountAmount += applicableItems[i].price * (discount.value / 100);
    }

    return discountAmount;
  }

  async applyDiscount(
    code: string,
    orderTotal: number,
    items: any[]
  ): Promise<DiscountApplication> {
    const discount = await this.validateDiscount(code, orderTotal, items);
    const amount = this.calculateDiscountAmount(discount, orderTotal, items);

    await this.incrementUsageCount(discount.id);

    return {
      discountId: discount.id,
      code: discount.code,
      amount,
      type: discount.type
    };
  }

  async findDiscountByCode(code: string): Promise<Discount | null> {
    logger.info(`Finding discount by code: ${code}`);
    return null;
  }

  async incrementUsageCount(discountId: string): Promise<void> {
    logger.info(`Incrementing usage count for discount: ${discountId}`);
  }

  async createDiscount(data: Partial<Discount>): Promise<Discount> {
    logger.info('Creating new discount');
    return {} as Discount;
  }

  async updateDiscount(id: string, data: Partial<Discount>): Promise<Discount> {
    logger.info(`Updating discount: ${id}`);
    return {} as Discount;
  }

  async deleteDiscount(id: string): Promise<void> {
    logger.info(`Deleting discount: ${id}`);
  }

  async getActiveDiscounts(): Promise<Discount[]> {
    logger.info('Fetching active discounts');
    return [];
  }
}

export const discountService = new DiscountService();
