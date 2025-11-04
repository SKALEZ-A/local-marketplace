import { InventoryModel } from '../models/inventory.model';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';

export class InventoryService {
  private inventoryModel: InventoryModel;

  constructor() {
    this.inventoryModel = new InventoryModel();
  }

  async getInventory(productId: string): Promise<any> {
    try {
      const inventory = await this.inventoryModel.findByProductId(productId);
      if (!inventory) {
        throw new AppError('Inventory not found', 404);
      }
      return inventory;
    } catch (error) {
      logger.error('Error fetching inventory:', error);
      throw error;
    }
  }

  async updateInventory(productId: string, quantity: number): Promise<any> {
    try {
      const inventory = await this.inventoryModel.findByProductId(productId);
      
      if (!inventory) {
        return await this.inventoryModel.create({
          productId,
          quantity,
          reserved: 0,
          available: quantity
        });
      }

      return await this.inventoryModel.update(inventory.id, {
        quantity,
        available: quantity - inventory.reserved
      });
    } catch (error) {
      logger.error('Error updating inventory:', error);
      throw error;
    }
  }

  async reserveInventory(productId: string, quantity: number): Promise<void> {
    try {
      const inventory = await this.inventoryModel.findByProductId(productId);
      
      if (!inventory) {
        throw new AppError('Inventory not found', 404);
      }

      if (inventory.available < quantity) {
        throw new AppError('Insufficient inventory', 400);
      }

      await this.inventoryModel.update(inventory.id, {
        reserved: inventory.reserved + quantity,
        available: inventory.available - quantity
      });

      logger.info(`Reserved ${quantity} units of product ${productId}`);
    } catch (error) {
      logger.error('Error reserving inventory:', error);
      throw error;
    }
  }

  async releaseInventory(productId: string, quantity: number): Promise<void> {
    try {
      const inventory = await this.inventoryModel.findByProductId(productId);
      
      if (!inventory) {
        throw new AppError('Inventory not found', 404);
      }

      await this.inventoryModel.update(inventory.id, {
        reserved: Math.max(0, inventory.reserved - quantity),
        available: inventory.available + quantity
      });

      logger.info(`Released ${quantity} units of product ${productId}`);
    } catch (error) {
      logger.error('Error releasing inventory:', error);
      throw error;
    }
  }

  async confirmReservation(productId: string, quantity: number): Promise<void> {
    try {
      const inventory = await this.inventoryModel.findByProductId(productId);
      
      if (!inventory) {
        throw new AppError('Inventory not found', 404);
      }

      await this.inventoryModel.update(inventory.id, {
        quantity: inventory.quantity - quantity,
        reserved: inventory.reserved - quantity
      });

      logger.info(`Confirmed reservation of ${quantity} units of product ${productId}`);
    } catch (error) {
      logger.error('Error confirming reservation:', error);
      throw error;
    }
  }

  async checkAvailability(productId: string, quantity: number): Promise<boolean> {
    try {
      const inventory = await this.inventoryModel.findByProductId(productId);
      return inventory ? inventory.available >= quantity : false;
    } catch (error) {
      logger.error('Error checking availability:', error);
      return false;
    }
  }
}
