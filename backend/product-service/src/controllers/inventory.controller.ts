import { Request, Response, NextFunction } from 'express';
import { InventoryService } from '../services/inventory.service';
import { AppError } from '../utils/appError';

export class InventoryController {
  private inventoryService: InventoryService;

  constructor() {
    this.inventoryService = new InventoryService();
  }

  getProductInventory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { productId } = req.params;
      const inventory = await this.inventoryService.getProductInventory(productId);
      
      res.status(200).json({
        success: true,
        data: inventory
      });
    } catch (error) {
      next(error);
    }
  };

  updateInventory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { productId } = req.params;
      const updateData = req.body;
      
      const inventory = await this.inventoryService.updateInventory(productId, updateData);
      
      res.status(200).json({
        success: true,
        data: inventory
      });
    } catch (error) {
      next(error);
    }
  };

  reserveInventory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { productId } = req.params;
      const { quantity, orderId } = req.body;
      
      const result = await this.inventoryService.reserveInventory(productId, quantity, orderId);
      
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  releaseInventory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { productId } = req.params;
      const { quantity, orderId } = req.body;
      
      const result = await this.inventoryService.releaseInventory(productId, quantity, orderId);
      
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  getLowStockProducts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { threshold = 10 } = req.query;
      const products = await this.inventoryService.getLowStockProducts(Number(threshold));
      
      res.status(200).json({
        success: true,
        data: products
      });
    } catch (error) {
      next(error);
    }
  };

  getOutOfStockProducts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const products = await this.inventoryService.getOutOfStockProducts();
      
      res.status(200).json({
        success: true,
        data: products
      });
    } catch (error) {
      next(error);
    }
  };

  bulkUpdateInventory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { updates } = req.body;
      const results = await this.inventoryService.bulkUpdateInventory(updates);
      
      res.status(200).json({
        success: true,
        data: results
      });
    } catch (error) {
      next(error);
    }
  };

  getInventoryHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { productId } = req.params;
      const { startDate, endDate, limit = 50 } = req.query;
      
      const history = await this.inventoryService.getInventoryHistory(
        productId,
        startDate as string,
        endDate as string,
        Number(limit)
      );
      
      res.status(200).json({
        success: true,
        data: history
      });
    } catch (error) {
      next(error);
    }
  };
}
