import mongoose, { Schema, Document } from 'mongoose';

export interface IDriver extends Document {
  user: mongoose.Types.ObjectId;
  vehicleType: string;
  vehicleNumber: string;
  licenseNumber: string;
  isAvailable: boolean;
  currentLocation?: {
    type: string;
    coordinates: number[];
  };
  rating: {
    average: number;
    count: number;
  };
  completedDeliveries: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

const driverSchema = new Schema<IDriver>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  vehicleType: {
    type: String,
    required: true,
    enum: ['bike', 'car', 'van', 'truck']
  },
  vehicleNumber: {
    type: String,
    required: true
  },
  licenseNumber: {
    type: String,
    required: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  currentLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    }
  },
  rating: {
    average: {
      type: Number,
      default: 0
    },
    count: {
      type: Number,
      default: 0
    }
  },
  completedDeliveries: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  }
}, {
  timestamps: true
});

driverSchema.index({ currentLocation: '2dsphere' });
driverSchema.index({ isAvailable: 1, status: 1 });

export const Driver = mongoose.model<IDriver>('Driver', driverSchema);
