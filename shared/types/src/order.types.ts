import { Address, OrderStatus, PaymentStatus } from './common.types';

export interface Order {
  id: string;
  orderNumber: string;
  buyerId: string;
  status: OrderStatus;
  items: OrderItem[];
  pricing: OrderPricing;
  payment: OrderPayment;
  delivery: OrderDelivery;
  timeline: OrderTimeline[];
  notes?: string;
  cancellation?: OrderCancellation;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: string;
  productId: string;
  sellerId: string;
  productName: string;
  productImage: string;
  variantId?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: string;
}

export interface OrderPricing {
  subtotal: number;
  tax: number;
  deliveryFee: number;
  discount: number;
  total: number;
  currency: string;
}

export interface OrderPayment {
  method: string;
  status: PaymentStatus;
  transactionId: string;
  paidAt?: Date;
}

export interface OrderDelivery {
  address: Address;
  method: string;
  estimatedDelivery: Date;
  actualDelivery?: Date;
  trackingNumber?: string;
}

export interface OrderTimeline {
  status: OrderStatus;
  timestamp: Date;
  notes?: string;
  location?: string;
}

export interface OrderCancellation {
  reason: string;
  cancelledBy: string;
  cancelledAt: Date;
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  totals: CartTotals;
  appliedCoupons: Coupon[];
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  quantity: number;
  price: number;
  product: {
    title: string;
    image: string;
    sellerId: string;
    inStock: boolean;
    maxQuantity: number;
  };
  addedAt: Date;
}

export interface CartTotals {
  subtotal: number;
  estimatedTax: number;
  estimatedDelivery: number;
  total: number;
}

export interface Coupon {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minPurchase?: number;
  maxDiscount?: number;
  expiresAt: Date;
}

export interface CheckoutInput {
  cartId: string;
  deliveryAddress: Address;
  paymentMethod: string;
  couponCode?: string;
}
