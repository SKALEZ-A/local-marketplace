import { DeliveryModel } from '../models/delivery.model';
import { DriverModel } from '../models/driver.model';
import { RouteModel } from '../models/route.model';
import { logger } from '../utils/logger';
import { AppError } from '../utils/appError';
import { GeolocationService } from './geolocation.service';
import { RouteOptimizationService } from './routeOptimization.service';
import { publishEvent } from '../config/rabbitmq';
import { addHours, addMinutes, format } from 'date-fns';
import _ from 'lodash';
import axios from 'axios';

export class DeliveryService {
  private geolocationService: GeolocationService;
  private routeOptimizationService: RouteOptimizationService;

  constructor() {
    this.geolocationService = new GeolocationService();
    this.routeOptimizationService = new RouteOptimizationService();
  }

  async createDelivery(data: {
    orderId: string;
    customerId: string;
    sellerId: string;
    pickupAddress: any;
    deliveryAddress: any;
    items: any[];
    deliveryType: 'standard' | 'express' | 'same_day';
    scheduledDate?: Date;
  }) {
    try {
      // Geocode addresses
      const pickupCoords = await this.geolocationService.geocode(data.pickupAddress);
      const deliveryCoords = await this.geolocationService.geocode(data.deliveryAddress);

      // Calculate distance and estimated time
      const distance = await this.geolocationService.calculateDistance(
        pickupCoords,
        deliveryCoords
      );

      const estimatedTime = this.calculateEstimatedDeliveryTime(
        distance,
        data.deliveryType
      );

      // Calculate delivery cost
      const deliveryCost = this.calculateDeliveryCost(distance, data.deliveryType);

      // Create delivery
      const delivery = await DeliveryModel.create({
        orderId: data.orderId,
        customerId: data.customerId,
        sellerId: data.sellerId,
        pickupAddress: {
          ...data.pickupAddress,
          coordinates: pickupCoords
        },
        deliveryAddress: {
          ...data.deliveryAddress,
          coordinates: deliveryCoords
        },
        items: data.items,
        deliveryType: data.deliveryType,
        status: 'pending',
        distance,
        estimatedDeliveryTime: estimatedTime,
        deliveryCost,
        scheduledDate: data.scheduledDate || new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Find available driver
      await this.assignDriver(delivery._id.toString());

      await publishEvent('delivery.created', {
        deliveryId: delivery._id,
        orderId: data.orderId,
        customerId: data.customerId
      });

      logger.info(`Delivery created: ${delivery._id}`);

      return delivery;
    } catch (error: any) {
      logger.error('Delivery creation failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async getDelivery(deliveryId: string) {
    try {
      const delivery = await DeliveryModel.findById(deliveryId)
        .populate('driverId', 'name phone vehicle rating')
        .populate('customerId', 'name phone')
        .populate('sellerId', 'name phone address');

      if (!delivery) {
        throw new AppError('Delivery not found', 404);
      }

      return delivery;
    } catch (error: any) {
      logger.error('Delivery retrieval failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async assignDriver(deliveryId: string) {
    try {
      const delivery = await DeliveryModel.findById(deliveryId);

      if (!delivery) {
        throw new AppError('Delivery not found', 404);
      }

      // Find available drivers near pickup location
      const availableDrivers = await DriverModel.find({
        status: 'available',
        verified: true,
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [
                delivery.pickupAddress.coordinates.longitude,
                delivery.pickupAddress.coordinates.latitude
              ]
            },
            $maxDistance: 10000 // 10km radius
          }
        }
      }).limit(10);

      if (availableDrivers.length === 0) {
        logger.warn(`No available drivers found for delivery: ${deliveryId}`);
        return null;
      }

      // Select best driver based on rating and distance
      const bestDriver = _.maxBy(availableDrivers, driver => {
        const distanceScore = 1 / (driver.currentDistance || 1);
        const ratingScore = driver.rating || 0;
        return distanceScore * 0.4 + ratingScore * 0.6;
      });

      if (!bestDriver) {
        return null;
      }

      // Assign driver
      await DeliveryModel.findByIdAndUpdate(deliveryId, {
        driverId: bestDriver._id,
        status: 'assigned',
        assignedAt: new Date(),
        updatedAt: new Date()
      });

      // Update driver status
      await DriverModel.findByIdAndUpdate(bestDriver._id, {
        status: 'busy',
        currentDelivery: deliveryId
      });

      await publishEvent('delivery.driver_assigned', {
        deliveryId,
        driverId: bestDriver._id,
        orderId: delivery.orderId
      });

      logger.info(`Driver assigned to delivery: ${deliveryId}`);

      return bestDriver;
    } catch (error: any) {
      logger.error('Driver assignment failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async updateDeliveryStatus(
    deliveryId: string,
    status: string,
    location?: { latitude: number; longitude: number },
    notes?: string
  ) {
    try {
      const delivery = await DeliveryModel.findById(deliveryId);

      if (!delivery) {
        throw new AppError('Delivery not found', 404);
      }

      const update: any = {
        status,
        updatedAt: new Date()
      };

      // Add status-specific updates
      switch (status) {
        case 'picked_up':
          update.pickedUpAt = new Date();
          break;
        case 'in_transit':
          update.inTransitAt = new Date();
          break;
        case 'out_for_delivery':
          update.outForDeliveryAt = new Date();
          break;
        case 'delivered':
          update.deliveredAt = new Date();
          // Update driver status
          if (delivery.driverId) {
            await DriverModel.findByIdAndUpdate(delivery.driverId, {
              status: 'available',
              currentDelivery: null,
              $inc: { completedDeliveries: 1 }
            });
          }
          break;
        case 'failed':
          update.failedAt = new Date();
          update.failureReason = notes;
          // Update driver status
          if (delivery.driverId) {
            await DriverModel.findByIdAndUpdate(delivery.driverId, {
              status: 'available',
              currentDelivery: null
            });
          }
          break;
      }

      // Add tracking update
      if (location) {
        update.$push = {
          trackingHistory: {
            status,
            location,
            timestamp: new Date(),
            notes
          }
        };
      }

      const updatedDelivery = await DeliveryModel.findByIdAndUpdate(
        deliveryId,
        update,
        { new: true }
      );

      await publishEvent('delivery.status_updated', {
        deliveryId,
        status,
        orderId: delivery.orderId,
        customerId: delivery.customerId
      });

      logger.info(`Delivery status updated: ${deliveryId} - ${status}`);

      return updatedDelivery;
    } catch (error: any) {
      logger.error('Delivery status update failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async trackDelivery(deliveryId: string) {
    try {
      const delivery = await DeliveryModel.findById(deliveryId)
        .populate('driverId', 'name phone vehicle currentLocation');

      if (!delivery) {
        throw new AppError('Delivery not found', 404);
      }

      let estimatedArrival = null;
      let currentDistance = null;

      if (delivery.driverId && delivery.status === 'in_transit') {
        const driver = await DriverModel.findById(delivery.driverId);
        
        if (driver && driver.currentLocation) {
          // Calculate distance from current location to delivery address
          currentDistance = await this.geolocationService.calculateDistance(
            driver.currentLocation,
            delivery.deliveryAddress.coordinates
          );

          // Estimate arrival time based on current distance
          const avgSpeed = 40; // km/h
          const timeInHours = currentDistance / avgSpeed;
          estimatedArrival = addHours(new Date(), timeInHours);
        }
      }

      return {
        delivery,
        currentDistance,
        estimatedArrival,
        trackingHistory: delivery.trackingHistory
      };
    } catch (error: any) {
      logger.error('Delivery tracking failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async getDeliveriesByOrder(orderId: string) {
    try {
      const deliveries = await DeliveryModel.find({ orderId })
        .populate('driverId', 'name phone vehicle rating')
        .sort({ createdAt: -1 });

      return deliveries;
    } catch (error: any) {
      logger.error('Order deliveries retrieval failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async getDeliveriesByCustomer(customerId: string, page: number = 1, limit: number = 20) {
    try {
      const skip = (page - 1) * limit;

      const deliveries = await DeliveryModel.find({ customerId })
        .populate('driverId', 'name phone vehicle rating')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await DeliveryModel.countDocuments({ customerId });

      return {
        deliveries,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error: any) {
      logger.error('Customer deliveries retrieval failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async getDeliveriesByDriver(driverId: string, page: number = 1, limit: number = 20) {
    try {
      const skip = (page - 1) * limit;

      const deliveries = await DeliveryModel.find({ driverId })
        .populate('customerId', 'name phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await DeliveryModel.countDocuments({ driverId });

      return {
        deliveries,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error: any) {
      logger.error('Driver deliveries retrieval failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async cancelDelivery(deliveryId: string, reason: string) {
    try {
      const delivery = await DeliveryModel.findById(deliveryId);

      if (!delivery) {
        throw new AppError('Delivery not found', 404);
      }

      if (['delivered', 'cancelled'].includes(delivery.status)) {
        throw new AppError('Cannot cancel this delivery', 400);
      }

      await DeliveryModel.findByIdAndUpdate(deliveryId, {
        status: 'cancelled',
        cancelledAt: new Date(),
        cancellationReason: reason,
        updatedAt: new Date()
      });

      // Update driver status if assigned
      if (delivery.driverId) {
        await DriverModel.findByIdAndUpdate(delivery.driverId, {
          status: 'available',
          currentDelivery: null
        });
      }

      await publishEvent('delivery.cancelled', {
        deliveryId,
        orderId: delivery.orderId,
        reason
      });

      logger.info(`Delivery cancelled: ${deliveryId}`);
    } catch (error: any) {
      logger.error('Delivery cancellation failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async rescheduleDelivery(deliveryId: string, newDate: Date) {
    try {
      const delivery = await DeliveryModel.findById(deliveryId);

      if (!delivery) {
        throw new AppError('Delivery not found', 404);
      }

      if (['delivered', 'cancelled', 'in_transit'].includes(delivery.status)) {
        throw new AppError('Cannot reschedule this delivery', 400);
      }

      await DeliveryModel.findByIdAndUpdate(deliveryId, {
        scheduledDate: newDate,
        status: 'rescheduled',
        updatedAt: new Date()
      });

      await publishEvent('delivery.rescheduled', {
        deliveryId,
        orderId: delivery.orderId,
        newDate
      });

      logger.info(`Delivery rescheduled: ${deliveryId}`);
    } catch (error: any) {
      logger.error('Delivery rescheduling failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async updateDriverLocation(driverId: string, location: { latitude: number; longitude: number }) {
    try {
      await DriverModel.findByIdAndUpdate(driverId, {
        currentLocation: location,
        lastLocationUpdate: new Date()
      });

      // Update active delivery tracking
      const activeDelivery = await DeliveryModel.findOne({
        driverId,
        status: { $in: ['picked_up', 'in_transit', 'out_for_delivery'] }
      });

      if (activeDelivery) {
        await DeliveryModel.findByIdAndUpdate(activeDelivery._id, {
          $push: {
            trackingHistory: {
              status: activeDelivery.status,
              location,
              timestamp: new Date()
            }
          }
        });
      }

      logger.info(`Driver location updated: ${driverId}`);
    } catch (error: any) {
      logger.error('Driver location update failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async getDeliveryStats(startDate: Date, endDate: Date) {
    try {
      const stats = await DeliveryModel.aggregate([
        {
          $match: {
            createdAt: {
              $gte: startDate,
              $lte: endDate
            }
          }
        },
        {
          $group: {
            _id: null,
            totalDeliveries: { $sum: 1 },
            completed: {
              $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
            },
            failed: {
              $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
            },
            cancelled: {
              $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
            },
            totalDistance: { $sum: '$distance' },
            totalRevenue: { $sum: '$deliveryCost' },
            avgDeliveryTime: {
              $avg: {
                $subtract: ['$deliveredAt', '$pickedUpAt']
              }
            }
          }
        }
      ]);

      if (stats.length === 0) {
        return {
          totalDeliveries: 0,
          completed: 0,
          failed: 0,
          cancelled: 0,
          totalDistance: 0,
          totalRevenue: 0,
          avgDeliveryTime: 0
        };
      }

      return stats[0];
    } catch (error: any) {
      logger.error('Delivery stats retrieval failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  calculateEstimatedDeliveryTime(distance: number, deliveryType: string): Date {
    let hoursToAdd = 0;

    switch (deliveryType) {
      case 'same_day':
        hoursToAdd = Math.min(distance / 40, 6); // Max 6 hours
        break;
      case 'express':
        hoursToAdd = Math.min(distance / 30, 24); // Max 24 hours
        break;
      case 'standard':
        hoursToAdd = Math.min(distance / 20, 72); // Max 72 hours
        break;
      default:
        hoursToAdd = 48;
    }

    return addHours(new Date(), hoursToAdd);
  }

  calculateDeliveryCost(distance: number, deliveryType: string): number {
    const baseRate = 5;
    const perKmRate = 1.5;

    let multiplier = 1;
    switch (deliveryType) {
      case 'same_day':
        multiplier = 2;
        break;
      case 'express':
        multiplier = 1.5;
        break;
      case 'standard':
        multiplier = 1;
        break;
    }

    return parseFloat((baseRate + distance * perKmRate * multiplier).toFixed(2));
  }

  async optimizeRoute(driverId: string, deliveryIds: string[]) {
    try {
      const deliveries = await DeliveryModel.find({
        _id: { $in: deliveryIds },
        driverId,
        status: { $in: ['assigned', 'picked_up'] }
      });

      if (deliveries.length === 0) {
        throw new AppError('No deliveries found for optimization', 404);
      }

      const optimizedRoute = await this.routeOptimizationService.optimizeRoute(deliveries);

      // Create route
      const route = await RouteModel.create({
        driverId,
        deliveries: optimizedRoute.deliveryOrder,
        totalDistance: optimizedRoute.totalDistance,
        estimatedDuration: optimizedRoute.estimatedDuration,
        waypoints: optimizedRoute.waypoints,
        createdAt: new Date()
      });

      logger.info(`Route optimized for driver: ${driverId}`);

      return route;
    } catch (error: any) {
      logger.error('Route optimization failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async rateDelivery(deliveryId: string, customerId: string, rating: number, feedback?: string) {
    try {
      const delivery = await DeliveryModel.findOne({
        _id: deliveryId,
        customerId
      });

      if (!delivery) {
        throw new AppError('Delivery not found or access denied', 404);
      }

      if (delivery.status !== 'delivered') {
        throw new AppError('Can only rate completed deliveries', 400);
      }

      await DeliveryModel.findByIdAndUpdate(deliveryId, {
        rating,
        feedback,
        ratedAt: new Date()
      });

      // Update driver rating
      if (delivery.driverId) {
        const driverDeliveries = await DeliveryModel.find({
          driverId: delivery.driverId,
          rating: { $exists: true, $ne: null }
        });

        const avgRating = _.meanBy(driverDeliveries, 'rating');

        await DriverModel.findByIdAndUpdate(delivery.driverId, {
          rating: parseFloat(avgRating.toFixed(2)),
          totalRatings: driverDeliveries.length
        });
      }

      logger.info(`Delivery rated: ${deliveryId}`);
    } catch (error: any) {
      logger.error('Delivery rating failed:', error);
      throw new AppError(error.message, 500);
    }
  }
}
