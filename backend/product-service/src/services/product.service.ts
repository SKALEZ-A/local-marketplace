import { ProductModel } from '../models/product.model';
import { InventoryService } from './inventory.service';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';
import { cacheGet, cacheSet, cacheDel } from '../utils/cache';

export class ProductService {
  private productModel: ProductModel;
  private inventoryService: InventoryService;

  constructor() {
    this.productModel = new ProductModel();
    this.inventoryService = new InventoryService();
  }

  async getAllProducts(filters: any = {}, page: number = 1, limit: number = 20): Promise<any> {
    try {
      const cacheKey = `products:${JSON.stringify(filters)}:${page}:${limit}`;
      const cached = await cacheGet(cacheKey);
      
      if (cached) {
        return cached;
      }

      const products = await this.productModel.findAll(filters, page, limit);
      await cacheSet(cacheKey, products, 300);

      return products;
    } catch (error) {
      logger.error('Error fetching products:', error);
      throw error;
    }
  }

  async getProductById(id: string): Promise<any> {
    try {
      const cacheKey = `product:${id}`;
      const cached = await cacheGet(cacheKey);
      
      if (cached) {
        return cached;
      }

      const product = await this.productModel.findById(id);
      if (!product) {
        throw new AppError('Product not found', 404);
      }

      await cacheSet(cacheKey, product, 600);
      return product;
    } catch (error) {
      logger.error('Error fetching product:', error);
      throw error;
    }
  }

  async createProduct(data: any): Promise<any> {
    try {
      const product = await this.productModel.create(data);
      
      if (data.stock) {
        await this.inventoryService.updateInventory(product.id, data.stock);
      }

      await cacheDel('products:*');
      logger.info(`Product created: ${product.id}`);
      return product;
    } catch (error) {
      logger.error('Error creating product:', error);
      throw error;
    }
  }

  async updateProduct(id: string, data: any): Promise<any> {
    try {
      const product = await this.productModel.findById(id);
      if (!product) {
        throw new AppError('Product not found', 404);
      }

      const updated = await this.productModel.update(id, data);
      
      if (data.stock !== undefined) {
        await this.inventoryService.updateInventory(id, data.stock);
      }

      await cacheDel(`product:${id}`);
      await cacheDel('products:*');
      
      logger.info(`Product updated: ${id}`);
      return updated;
    } catch (error) {
      logger.error('Error updating product:', error);
      throw error;
    }
  }

  async deleteProduct(id: string): Promise<void> {
    try {
      const product = await this.productModel.findById(id);
      if (!product) {
        throw new AppError('Product not found', 404);
      }

      await this.productModel.delete(id);
      await cacheDel(`product:${id}`);
      await cacheDel('products:*');
      
      logger.info(`Product deleted: ${id}`);
    } catch (error) {
      logger.error('Error deleting product:', error);
      throw error;
    }
  }

  async searchProducts(query: string, filters: any = {}): Promise<any> {
    try {
      return await this.productModel.search(query, filters);
    } catch (error) {
      logger.error('Error searching products:', error);
      throw error;
    }
  }
}
