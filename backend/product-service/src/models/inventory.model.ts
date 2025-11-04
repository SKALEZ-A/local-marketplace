import mongoose, { Schema, Document } from 'mongoose';

export interface IInventory extends Document {
  productId: string;
  variantId?: string;
  sku: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  reorderPoint: number;
  reorderQuantity: number;
  warehouse: IWarehouseLocation;
  supplier?: ISupplierInfo;
  costPrice: number;
  lastRestocked?: Date;
  expiryDate?: Date;
  batchNumber?: string;
  serialNumbers?: string[];
  status: InventoryStatus;
  movements: IInventoryMovement[];
  alerts: IInventoryAlert[];
  createdAt: Date;
  updatedAt: Date;
}

export enum InventoryStatus {
  IN_STOCK = 'IN_STOCK',
  LOW_STOCK = 'LOW_STOCK',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  DISCONTINUED = 'DISCONTINUED',
  BACKORDERED = 'BACKORDERED'
}

export interface IWarehouseLocation {
  warehouseId: string;
  warehouseName: string;
  location: {
    aisle: string;
    rack: string;
    shelf: string;
    bin: string;
  };
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
}

export interface ISupplierInfo {
  supplierId: string;
  supplierName: string;
  contactEmail: string;
  contactPhone: string;
  leadTime: number; // in days
  minimumOrderQuantity: number;
}

export interface IInventoryMovement {
  type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER' | 'RETURN' | 'DAMAGED' | 'LOST';
  quantity: number;
  reason: string;
  reference?: string; // Order ID, Transfer ID, etc.
  performedBy: string;
  notes?: string;
  timestamp: Date;
}

export interface IInventoryAlert {
  type: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'EXPIRING_SOON' | 'EXPIRED' | 'OVERSTOCK';
  message: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  isResolved: boolean;
  createdAt: Date;
  resolvedAt?: Date;
}

const WarehouseLocationSchema = new Schema({
  warehouseId: { type: String, required: true },
  warehouseName: { type: String, required: true },
  location: {
    aisle: String,
    rack: String,
    shelf: String,
    bin: String
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    postalCode: String
  }
});

const SupplierInfoSchema = new Schema({
  supplierId: { type: String, required: true },
  supplierName: { type: String, required: true },
  contactEmail: String,
  contactPhone: String,
  leadTime: { type: Number, default: 7 },
  minimumOrderQuantity: { type: Number, default: 1 }
});

const InventoryMovementSchema = new Schema({
  type: {
    type: String,
    enum: ['IN', 'OUT', 'ADJUSTMENT', 'TRANSFER', 'RETURN', 'DAMAGED', 'LOST'],
    required: true
  },
  quantity: { type: Number, required: true },
  reason: { type: String, required: true },
  reference: String,
  performedBy: { type: String, required: true },
  notes: String,
  timestamp: { type: Date, default: Date.now }
});

const InventoryAlertSchema = new Schema({
  type: {
    type: String,
    enum: ['LOW_STOCK', 'OUT_OF_STOCK', 'EXPIRING_SOON', 'EXPIRED', 'OVERSTOCK'],
    required: true
  },
  message: { type: String, required: true },
  severity: {
    type: String,
    enum: ['INFO', 'WARNING', 'CRITICAL'],
    default: 'INFO'
  },
  isResolved: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  resolvedAt: Date
});

const InventorySchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    variantId: {
      type: Schema.Types.ObjectId,
      ref: 'ProductVariant'
    },
    sku: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    reservedQuantity: {
      type: Number,
      default: 0,
      min: 0
    },
    availableQuantity: {
      type: Number,
      default: 0,
      min: 0
    },
    reorderPoint: {
      type: Number,
      default: 10,
      min: 0
    },
    reorderQuantity: {
      type: Number,
      default: 50,
      min: 0
    },
    warehouse: {
      type: WarehouseLocationSchema,
      required: true
    },
    supplier: SupplierInfoSchema,
    costPrice: {
      type: Number,
      required: true,
      min: 0
    },
    lastRestocked: Date,
    expiryDate: Date,
    batchNumber: String,
    serialNumbers: [String],
    status: {
      type: String,
      enum: Object.values(InventoryStatus),
      default: InventoryStatus.IN_STOCK
    },
    movements: [InventoryMovementSchema],
    alerts: [InventoryAlertSchema]
  },
  {
    timestamps: true
  }
);

// Indexes
InventorySchema.index({ productId: 1, variantId: 1 });
InventorySchema.index({ sku: 1 });
InventorySchema.index({ 'warehouse.warehouseId': 1 });
InventorySchema.index({ status: 1 });
InventorySchema.index({ quantity: 1 });
InventorySchema.index({ expiryDate: 1 });

// Pre-save middleware to calculate available quantity and update status
InventorySchema.pre('save', function(next) {
  this.availableQuantity = Math.max(0, this.quantity - this.reservedQuantity);
  
  // Update status based on quantity
  if (this.quantity === 0) {
    this.status = InventoryStatus.OUT_OF_STOCK;
  } else if (this.quantity <= this.reorderPoint) {
    this.status = InventoryStatus.LOW_STOCK;
  } else {
    this.status = InventoryStatus.IN_STOCK;
  }
  
  // Check for expiry alerts
  if (this.expiryDate) {
    const daysUntilExpiry = Math.ceil((this.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
      this.addAlert('EXPIRED', 'Product has expired', 'CRITICAL');
    } else if (daysUntilExpiry <= 30) {
      this.addAlert('EXPIRING_SOON', `Product expires in ${daysUntilExpiry} days`, 'WARNING');
    }
  }
  
  next();
});

// Instance methods
InventorySchema.methods.reserve = async function(quantity: number, reference: string) {
  if (this.availableQuantity < quantity) {
    throw new Error('Insufficient inventory available');
  }
  
  this.reservedQuantity += quantity;
  this.movements.push({
    type: 'OUT',
    quantity: -quantity,
    reason: 'Reserved for order',
    reference,
    performedBy: 'system',
    timestamp: new Date()
  });
  
  await this.save();
};

InventorySchema.methods.release = async function(quantity: number, reference: string) {
  this.reservedQuantity = Math.max(0, this.reservedQuantity - quantity);
  this.movements.push({
    type: 'IN',
    quantity,
    reason: 'Released from reservation',
    reference,
    performedBy: 'system',
    timestamp: new Date()
  });
  
  await this.save();
};

InventorySchema.methods.fulfill = async function(quantity: number, reference: string) {
  if (this.reservedQuantity < quantity) {
    throw new Error('Insufficient reserved inventory');
  }
  
  this.quantity -= quantity;
  this.reservedQuantity -= quantity;
  this.movements.push({
    type: 'OUT',
    quantity: -quantity,
    reason: 'Order fulfilled',
    reference,
    performedBy: 'system',
    timestamp: new Date()
  });
  
  await this.save();
};

InventorySchema.methods.restock = async function(quantity: number, performedBy: string, notes?: string) {
  this.quantity += quantity;
  this.lastRestocked = new Date();
  this.movements.push({
    type: 'IN',
    quantity,
    reason: 'Restocked',
    performedBy,
    notes,
    timestamp: new Date()
  });
  
  await this.save();
};

InventorySchema.methods.adjust = async function(
  newQuantity: number,
  reason: string,
  performedBy: string,
  notes?: string
) {
  const difference = newQuantity - this.quantity;
  this.quantity = newQuantity;
  
  this.movements.push({
    type: 'ADJUSTMENT',
    quantity: difference,
    reason,
    performedBy,
    notes,
    timestamp: new Date()
  });
  
  await this.save();
};

InventorySchema.methods.addAlert = function(
  type: string,
  message: string,
  severity: string = 'INFO'
) {
  const existingAlert = this.alerts.find(
    (alert: IInventoryAlert) => alert.type === type && !alert.isResolved
  );
  
  if (!existingAlert) {
    this.alerts.push({
      type,
      message,
      severity,
      isResolved: false,
      createdAt: new Date()
    });
  }
};

InventorySchema.methods.resolveAlert = function(alertId: string) {
  const alert = this.alerts.id(alertId);
  if (alert) {
    alert.isResolved = true;
    alert.resolvedAt = new Date();
  }
};

InventorySchema.methods.getMovementHistory = function(days: number = 30) {
  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return this.movements.filter((movement: IInventoryMovement) => movement.timestamp >= cutoffDate);
};

InventorySchema.methods.calculateTurnoverRate = function(days: number = 30) {
  const movements = this.getMovementHistory(days);
  const outgoingQuantity = movements
    .filter((m: IInventoryMovement) => m.type === 'OUT')
    .reduce((sum: number, m: IInventoryMovement) => sum + Math.abs(m.quantity), 0);
  
  const averageInventory = (this.quantity + this.reservedQuantity) / 2;
  
  if (averageInventory === 0) return 0;
  return outgoingQuantity / averageInventory;
};

// Static methods
InventorySchema.statics.findBySku = function(sku: string) {
  return this.findOne({ sku: sku.toUpperCase() });
};

InventorySchema.statics.findByProduct = function(productId: string) {
  return this.find({ productId });
};

InventorySchema.statics.findLowStock = function() {
  return this.find({ status: InventoryStatus.LOW_STOCK });
};

InventorySchema.statics.findOutOfStock = function() {
  return this.find({ status: InventoryStatus.OUT_OF_STOCK });
};

InventorySchema.statics.findExpiringSoon = function(days: number = 30) {
  const futureDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  return this.find({
    expiryDate: {
      $gte: new Date(),
      $lte: futureDate
    }
  });
};

InventorySchema.statics.getWarehouseInventory = function(warehouseId: string) {
  return this.find({ 'warehouse.warehouseId': warehouseId });
};

InventorySchema.statics.getInventoryValue = async function(warehouseId?: string) {
  const query = warehouseId ? { 'warehouse.warehouseId': warehouseId } : {};
  const inventory = await this.find(query);
  
  return inventory.reduce((total: number, item: IInventory) => {
    return total + (item.quantity * item.costPrice);
  }, 0);
};

export const Inventory = mongoose.model<IInventory>('Inventory', InventorySchema);
