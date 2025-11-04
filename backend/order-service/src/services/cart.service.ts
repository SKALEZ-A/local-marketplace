import { Cart } from '../models/cart.model';
import { AppError } from '../utils/appError';
import axios from 'axios';

export class CartService {
  async getCart(userId: string) {
    let cart = await Cart.findOne({ user: userId }).populate('items.product');
    
    if (!cart) {
      cart = await Cart.create({ user: userId, items: [] });
    }

    await this.validateCartItems(cart);
    return cart;
  }

  async addItem(userId: string, itemData: any) {
    const cart = await this.getCart(userId);
    
    const existingItemIndex = cart.items.findIndex(
      item => item.product.toString() === itemData.productId
    );

    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity += itemData.quantity;
    } else {
      cart.items.push({
        product: itemData.productId,
        quantity: itemData.quantity,
        price: itemData.price,
        variant: itemData.variant
      });
    }

    await cart.save();
    return await cart.populate('items.product');
  }

  async updateItem(userId: string, itemId: string, quantity: number) {
    const cart = await this.getCart(userId);
    const item = cart.items.id(itemId);

    if (!item) {
      throw new AppError('Item not found in cart', 404);
    }

    if (quantity <= 0) {
      cart.items.pull(itemId);
    } else {
      item.quantity = quantity;
    }

    await cart.save();
    return await cart.populate('items.product');
  }

  async removeItem(userId: string, itemId: string) {
    const cart = await this.getCart(userId);
    cart.items.pull(itemId);
    await cart.save();
    return await cart.populate('items.product');
  }

  async clearCart(userId: string) {
    const cart = await this.getCart(userId);
    cart.items = [];
    await cart.save();
    return cart;
  }

  async getCartSummary(userId: string) {
    const cart = await this.getCart(userId);
    
    const subtotal = cart.items.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);

    const tax = subtotal * 0.1;
    const shipping = subtotal > 50 ? 0 : 10;
    const total = subtotal + tax + shipping;

    return {
      itemCount: cart.items.length,
      subtotal,
      tax,
      shipping,
      discount: cart.discount || 0,
      total: total - (cart.discount || 0)
    };
  }

  async applyCoupon(userId: string, couponCode: string) {
    const cart = await this.getCart(userId);
    
    const couponResponse = await axios.get(
      `${process.env.COUPON_SERVICE_URL}/validate/${couponCode}`
    );

    if (!couponResponse.data.valid) {
      throw new AppError('Invalid coupon code', 400);
    }

    cart.coupon = couponCode;
    cart.discount = couponResponse.data.discount;
    await cart.save();

    return cart;
  }

  async removeCoupon(userId: string) {
    const cart = await this.getCart(userId);
    cart.coupon = undefined;
    cart.discount = 0;
    await cart.save();
    return cart;
  }

  private async validateCartItems(cart: any) {
    for (const item of cart.items) {
      try {
        const productResponse = await axios.get(
          `${process.env.PRODUCT_SERVICE_URL}/products/${item.product}`
        );
        
        if (!productResponse.data.data.isActive) {
          cart.items.pull(item._id);
        }
      } catch (error) {
        cart.items.pull(item._id);
      }
    }
    
    if (cart.isModified('items')) {
      await cart.save();
    }
  }
}
