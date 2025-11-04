export interface CartItem {
  productId: string;
  variantId?: string;
  quantity: number;
  addedAt: Date;
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  createdAt: Date;
  updatedAt: Date;
}

export class CartModel {
  private carts: Map<string, Cart> = new Map();

  async findById(id: string): Promise<Cart | null> {
    return this.carts.get(id) || null;
  }

  async findByUserId(userId: string): Promise<Cart | null> {
    for (const cart of this.carts.values()) {
      if (cart.userId === userId) {
        return cart;
      }
    }
    return null;
  }

  async create(cartData: Omit<Cart, 'id'>): Promise<Cart> {
    const id = this.generateId();
    const cart: Cart = { id, ...cartData };
    this.carts.set(id, cart);
    return cart;
  }

  async update(id: string, cartData: Partial<Cart>): Promise<Cart> {
    const cart = this.carts.get(id);
    if (!cart) {
      throw new Error('Cart not found');
    }
    const updatedCart = { ...cart, ...cartData };
    this.carts.set(id, updatedCart);
    return updatedCart;
  }

  async delete(id: string): Promise<void> {
    this.carts.delete(id);
  }

  private generateId(): string {
    return `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
