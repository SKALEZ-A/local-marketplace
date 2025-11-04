export interface DeliveryAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface Delivery {
  id: string;
  orderId: string;
  trackingNumber: string;
  carrier: string;
  status: 'pending' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'failed' | 'returned';
  pickupAddress: DeliveryAddress;
  deliveryAddress: DeliveryAddress;
  estimatedDelivery: Date;
  actualDelivery?: Date;
  driverId?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class DeliveryModel {
  private deliveries: Map<string, Delivery> = new Map();

  async findById(id: string): Promise<Delivery | null> {
    return this.deliveries.get(id) || null;
  }

  async findByOrderId(orderId: string): Promise<Delivery | null> {
    for (const delivery of this.deliveries.values()) {
      if (delivery.orderId === orderId) {
        return delivery;
      }
    }
    return null;
  }

  async findByTrackingNumber(trackingNumber: string): Promise<Delivery | null> {
    for (const delivery of this.deliveries.values()) {
      if (delivery.trackingNumber === trackingNumber) {
        return delivery;
      }
    }
    return null;
  }

  async findByDriverId(driverId: string): Promise<Delivery[]> {
    return Array.from(this.deliveries.values()).filter(d => d.driverId === driverId);
  }

  async create(deliveryData: Omit<Delivery, 'id' | 'createdAt' | 'updatedAt'>): Promise<Delivery> {
    const id = this.generateId();
    const delivery: Delivery = {
      id,
      ...deliveryData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.deliveries.set(id, delivery);
    return delivery;
  }

  async update(id: string, deliveryData: Partial<Delivery>): Promise<Delivery> {
    const delivery = this.deliveries.get(id);
    if (!delivery) {
      throw new Error('Delivery not found');
    }
    const updatedDelivery = { ...delivery, ...deliveryData, updatedAt: new Date() };
    this.deliveries.set(id, updatedDelivery);
    return updatedDelivery;
  }

  private generateId(): string {
    return `del_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateTrackingNumber(): string {
    return `TRK${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  }
}
