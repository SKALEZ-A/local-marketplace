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

export interface DeliveryStatus {
  status: 'pending' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'failed' | 'returned';
  timestamp: Date;
  location?: {
    latitude: number;
    longitude: number;
  };
  notes?: string;
}

export interface Delivery {
  id: string;
  orderId: string;
  trackingNumber: string;
  carrier: string;
  status: DeliveryStatus['status'];
  pickupAddress: DeliveryAddress;
  deliveryAddress: DeliveryAddress;
  estimatedDelivery: Date;
  actualDelivery?: Date;
  driverId?: string;
  statusHistory: DeliveryStatus[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeliveryDriver {
  id: string;
  name: string;
  phone: string;
  email: string;
  vehicleType: string;
  vehicleNumber: string;
  rating: number;
  totalDeliveries: number;
  activeDeliveries: number;
  status: 'available' | 'busy' | 'offline';
}

export interface DeliveryEstimate {
  estimatedDays: number;
  estimatedCost: number;
  carrier: string;
  serviceType: string;
}
