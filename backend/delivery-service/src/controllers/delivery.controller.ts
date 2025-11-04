import { Request, Response, NextFunction } from 'express';
import { DeliveryService } from '../services/delivery.service';
import { logger } from '../utils/logger';

export class DeliveryController {
  private deliveryService: DeliveryService;

  constructor() {
    this.deliveryService = new DeliveryService();
  }

  createDelivery = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const deliveryData = req.body;
      const delivery = await this.deliveryService.createDelivery(deliveryData);

      res.status(201).json({
        success: true,
        message: 'Delivery created successfully',
        data: delivery
      });
    } catch (error) {
      logger.error('Error creating delivery:', error);
      next(error);
    }
  };

  getDelivery = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const delivery = await this.deliveryService.getDelivery(id);

      res.status(200).json({
        success: true,
        data: delivery
      });
    } catch (error) {
      logger.error('Error fetching delivery:', error);
      next(error);
    }
  };

  trackDelivery = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { trackingNumber } = req.params;
      const delivery = await this.deliveryService.trackDelivery(trackingNumber);

      res.status(200).json({
        success: true,
        data: delivery
      });
    } catch (error) {
      logger.error('Error tracking delivery:', error);
      next(error);
    }
  };

  updateDeliveryStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;
      const delivery = await this.deliveryService.updateDeliveryStatus(id, status, notes);

      res.status(200).json({
        success: true,
        message: 'Delivery status updated',
        data: delivery
      });
    } catch (error) {
      logger.error('Error updating delivery status:', error);
      next(error);
    }
  };

  assignDriver = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { driverId } = req.body;
      const delivery = await this.deliveryService.assignDriver(id, driverId);

      res.status(200).json({
        success: true,
        message: 'Driver assigned successfully',
        data: delivery
      });
    } catch (error) {
      logger.error('Error assigning driver:', error);
      next(error);
    }
  };

  getDriverDeliveries = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { driverId } = req.params;
      const deliveries = await this.deliveryService.getDriverDeliveries(driverId);

      res.status(200).json({
        success: true,
        data: deliveries
      });
    } catch (error) {
      logger.error('Error fetching driver deliveries:', error);
      next(error);
    }
  };
}
