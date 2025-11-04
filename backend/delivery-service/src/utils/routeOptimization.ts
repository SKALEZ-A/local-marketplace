import { logger } from './logger';

export interface Location {
  lat: number;
  lng: number;
  address: string;
}

export interface DeliveryStop {
  id: string;
  location: Location;
  priority: number;
  timeWindow?: {
    start: Date;
    end: Date;
  };
  estimatedDuration: number;
}

export interface OptimizedRoute {
  stops: DeliveryStop[];
  totalDistance: number;
  totalDuration: number;
  estimatedCost: number;
}

export class RouteOptimizer {
  private readonly EARTH_RADIUS_KM = 6371;
  private readonly COST_PER_KM = 0.5;
  private readonly COST_PER_MINUTE = 0.25;

  optimizeRoute(
    startLocation: Location,
    stops: DeliveryStop[],
    endLocation?: Location
  ): OptimizedRoute {
    if (stops.length === 0) {
      return {
        stops: [],
        totalDistance: 0,
        totalDuration: 0,
        estimatedCost: 0
      };
    }

    const sortedStops = this.sortByPriorityAndProximity(startLocation, stops);
    const optimizedStops = this.applyNearestNeighbor(startLocation, sortedStops);

    const totalDistance = this.calculateTotalDistance(
      startLocation,
      optimizedStops,
      endLocation
    );

    const totalDuration = this.calculateTotalDuration(optimizedStops);

    const estimatedCost = this.calculateCost(totalDistance, totalDuration);

    return {
      stops: optimizedStops,
      totalDistance,
      totalDuration,
      estimatedCost
    };
  }

  private sortByPriorityAndProximity(
    start: Location,
    stops: DeliveryStop[]
  ): DeliveryStop[] {
    return stops.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }

      const distA = this.calculateDistance(start, a.location);
      const distB = this.calculateDistance(start, b.location);
      return distA - distB;
    });
  }

  private applyNearestNeighbor(
    start: Location,
    stops: DeliveryStop[]
  ): DeliveryStop[] {
    const result: DeliveryStop[] = [];
    const remaining = [...stops];
    let current = start;

    while (remaining.length > 0) {
      let nearestIndex = 0;
      let nearestDistance = this.calculateDistance(current, remaining[0].location);

      for (let i = 1; i < remaining.length; i++) {
        const distance = this.calculateDistance(current, remaining[i].location);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = i;
        }
      }

      const nearest = remaining.splice(nearestIndex, 1)[0];
      result.push(nearest);
      current = nearest.location;
    }

    return result;
  }

  calculateDistance(loc1: Location, loc2: Location): number {
    const dLat = this.toRadians(loc2.lat - loc1.lat);
    const dLng = this.toRadians(loc2.lng - loc1.lng);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(loc1.lat)) *
        Math.cos(this.toRadians(loc2.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return this.EARTH_RADIUS_KM * c;
  }

  private calculateTotalDistance(
    start: Location,
    stops: DeliveryStop[],
    end?: Location
  ): number {
    let total = 0;
    let current = start;

    for (const stop of stops) {
      total += this.calculateDistance(current, stop.location);
      current = stop.location;
    }

    if (end) {
      total += this.calculateDistance(current, end);
    }

    return total;
  }

  private calculateTotalDuration(stops: DeliveryStop[]): number {
    return stops.reduce((sum, stop) => sum + stop.estimatedDuration, 0);
  }

  private calculateCost(distance: number, duration: number): number {
    return distance * this.COST_PER_KM + duration * this.COST_PER_MINUTE;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  estimateArrivalTime(
    currentLocation: Location,
    destination: Location,
    averageSpeed: number = 40
  ): Date {
    const distance = this.calculateDistance(currentLocation, destination);
    const hours = distance / averageSpeed;
    const milliseconds = hours * 60 * 60 * 1000;
    return new Date(Date.now() + milliseconds);
  }

  validateTimeWindows(stops: DeliveryStop[]): boolean {
    let currentTime = new Date();

    for (const stop of stops) {
      if (stop.timeWindow) {
        if (currentTime > stop.timeWindow.end) {
          logger.warn(`Stop ${stop.id} cannot be reached within time window`);
          return false;
        }
        currentTime = new Date(currentTime.getTime() + stop.estimatedDuration * 60000);
      }
    }

    return true;
  }
}

export const routeOptimizer = new RouteOptimizer();
