export interface PaginationParams {
  page?: number;
  limit?: number;
  cursor?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
    nextCursor?: string;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  timestamp: string;
  requestId: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  path?: string;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Address {
  id: string;
  type: 'shipping' | 'billing';
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
  coordinates?: Coordinates;
}

export interface TimeRange {
  start: Date;
  end: Date;
}

export interface SearchFilters {
  query?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  location?: Coordinates;
  radius?: number;
  inStock?: boolean;
  rating?: number;
  sortBy?: 'price' | 'date' | 'popularity' | 'rating';
  sortOrder?: 'asc' | 'desc';
}

export type UserRole = 'buyer' | 'seller' | 'admin';
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'completed' | 'cancelled' | 'refunded';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'in_escrow';
export type SubscriptionTier = 'basic' | 'premium' | 'enterprise';
