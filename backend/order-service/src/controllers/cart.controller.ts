import { Request, Response, NextFunction } from 'express';
import { redisClient } from '../config/redis';
import { AppError } from '../utils/appError';
import logger from '../utils/logger';

interface CartItem {
  productId: string;
  quantity: number;
  variantId?: string;
  addedAt: Date;
}

interface Cart {
  userId: string;
  items: CartItem[];
  updatedAt: Date;
}

export const getCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    const cartData = await redisClient.get(`cart:${userId}`);
    
    if (!cartData) {
      return res.status(200).json({
        success: true,
        data: {
          cart: {
            userId,
            items: [],
            updatedAt: new Date()
          }
        }
      });
    }

    const cart: Cart = JSON.parse(cartData);

    // Fetch product details for each item
    const itemsWithDetails = await Promise.all(
      cart.items.map(async (item) => {
        try {
          const response = await fetch(`${process.env.PRODUCT_SERVICE_URL}/api/products/${item.productId}`);
          const productData = await response.json();

          if (productData.success) {
            return {
              ...item,
              product: productData.data.product
            };
          }
          return item;
        } catch (error) {
          logger.error(`Failed to fetch product ${item.productId}:`, error);
          return item;
        }
      })
    );

    res.status(200).json({
      success: true,
      data: {
        cart: {
          ...cart,
          items: itemsWithDetails
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const addToCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { productId, quantity = 1, variantId } = req.body;

    if (quantity < 1) {
      throw new AppError('Quantity must be at least 1', 400);
    }

    // Verify product exists and is available
    const response = await fetch(`${process.env.PRODUCT_SERVICE_URL}/api/products/${productId}`);
    const productData = await response.json();

    if (!productData.success) {
      throw new AppError('Product not found', 404);
    }

    if (productData.data.product.status !== 'active') {
      throw new AppError('Product is not available', 400);
    }

    // Get current cart
    const cartData = await redisClient.get(`cart:${userId}`);
    let cart: Cart = cartData ? JSON.parse(cartData) : { userId, items: [], updatedAt: new Date() };

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(
      item => item.productId === productId && item.variantId === variantId
    );

    if (existingItemIndex > -1) {
      // Update quantity
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      // Add new item
      cart.items.push({
        productId,
        quantity,
        variantId,
        addedAt: new Date()
      });
    }

    cart.updatedAt = new Date();

    // Save cart to Redis (30 days expiry)
    await redisClient.setEx(`cart:${userId}`, 30 * 24 * 60 * 60, JSON.stringify(cart));

    logger.info(`Item added to cart: ${userId} - ${productId}`);

    res.status(200).json({
      success: true,
      message: 'Item added to cart',
      data: { cart }
    });
  } catch (error) {
    next(error);
  }
};

export const updateCartItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { productId, quantity, variantId } = req.body;

    if (quantity < 0) {
      throw new AppError('Quantity cannot be negative', 400);
    }

    const cartData = await redisClient.get(`cart:${userId}`);
    
    if (!cartData) {
      throw new AppError('Cart not found', 404);
    }

    const cart: Cart = JSON.parse(cartData);

    const itemIndex = cart.items.findIndex(
      item => item.productId === productId && item.variantId === variantId
    );

    if (itemIndex === -1) {
      throw new AppError('Item not found in cart', 404);
    }

    if (quantity === 0) {
      // Remove item
      cart.items.splice(itemIndex, 1);
    } else {
      // Update quantity
      cart.items[itemIndex].quantity = quantity;
    }

    cart.updatedAt = new Date();

    await redisClient.setEx(`cart:${userId}`, 30 * 24 * 60 * 60, JSON.stringify(cart));

    logger.info(`Cart item updated: ${userId} - ${productId}`);

    res.status(200).json({
      success: true,
      message: 'Cart updated',
      data: { cart }
    });
  } catch (error) {
    next(error);
  }
};

export const removeFromCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { productId, variantId } = req.body;

    const cartData = await redisClient.get(`cart:${userId}`);
    
    if (!cartData) {
      throw new AppError('Cart not found', 404);
    }

    const cart: Cart = JSON.parse(cartData);

    cart.items = cart.items.filter(
      item => !(item.productId === productId && item.variantId === variantId)
    );

    cart.updatedAt = new Date();

    await redisClient.setEx(`cart:${userId}`, 30 * 24 * 60 * 60, JSON.stringify(cart));

    logger.info(`Item removed from cart: ${userId} - ${productId}`);

    res.status(200).json({
      success: true,
      message: 'Item removed from cart',
      data: { cart }
    });
  } catch (error) {
    next(error);
  }
};

export const clearCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    await redisClient.del(`cart:${userId}`);

    logger.info(`Cart cleared: ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Cart cleared'
    });
  } catch (error) {
    next(error);
  }
};

export const validateCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    const cartData = await redisClient.get(`cart:${userId}`);
    
    if (!cartData) {
      return res.status(200).json({
        success: true,
        data: {
          valid: true,
          issues: []
        }
      });
    }

    const cart: Cart = JSON.parse(cartData);
    const issues: any[] = [];

    // Validate each item
    for (const item of cart.items) {
      try {
        const response = await fetch(`${process.env.PRODUCT_SERVICE_URL}/api/products/${item.productId}`);
        const productData = await response.json();

        if (!productData.success) {
          issues.push({
            productId: item.productId,
            issue: 'Product no longer available'
          });
          continue;
        }

        const product = productData.data.product;

        // Check if product is active
        if (product.status !== 'active') {
          issues.push({
            productId: item.productId,
            issue: 'Product is no longer available'
          });
        }

        // Check inventory
        const inventoryResponse = await fetch(
          `${process.env.INVENTORY_SERVICE_URL}/api/inventory/product/${item.productId}`
        );
        const inventoryData = await inventoryResponse.json();

        if (inventoryData.success && inventoryData.data.availableQuantity < item.quantity) {
          issues.push({
            productId: item.productId,
            issue: `Only ${inventoryData.data.availableQuantity} items available`,
            availableQuantity: inventoryData.data.availableQuantity
          });
        }

      } catch (error) {
        logger.error(`Failed to validate cart item ${item.productId}:`, error);
        issues.push({
          productId: item.productId,
          issue: 'Unable to validate product'
        });
      }
    }

    res.status(200).json({
      success: true,
      data: {
        valid: issues.length === 0,
        issues
      }
    });
  } catch (error) {
    next(error);
  }
};
