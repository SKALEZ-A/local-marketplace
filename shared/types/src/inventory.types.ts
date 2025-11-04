export interface Inventory {
  id: string;
  productId: string;
  quantity: number;
  reserved: number;
  available: number;
  lowStockThreshold: number;
  reorderPoint: number;
  reorderQuantity: number;
  location?: string;
  lastRestocked?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryTransaction {
  id: string;
  productId: string;
  type: 'restock' | 'sale' | 'return' | 'adjustment' | 'reservation' | 'release';
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  reason?: string;
  reference?: string;
  performedBy: string;
  timestamp: Date;
}

export interface StockAlert {
  productId: string;
  currentStock: number;
  threshold: number;
  alertType: 'low_stock' | 'out_of_stock' | 'overstock';
  severity: 'info' | 'warning' | 'critical';
  createdAt: Date;
}

export interface InventoryReservation {
  id: string;
  productId: string;
  quantity: number;
  orderId: string;
  expiresAt: Date;
  status: 'active' | 'confirmed' | 'released' | 'expired';
  createdAt: Date;
}
