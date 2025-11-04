import mongoose, { Schema, Document } from 'mongoose';

export interface IEvent extends Document {
  userId?: mongoose.Types.ObjectId;
  sessionId: string;
  eventType: string;
  eventName: string;
  properties?: any;
  page?: string;
  referrer?: string;
  userAgent?: string;
  ipAddress?: string;
  timestamp: Date;
  createdAt: Date;
}

const eventSchema = new Schema<IEvent>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  sessionId: {
    type: String,
    required: true
  },
  eventType: {
    type: String,
    required: true,
    enum: ['page_view', 'click', 'purchase', 'add_to_cart', 'search', 'custom']
  },
  eventName: {
    type: String,
    required: true
  },
  properties: Schema.Types.Mixed,
  page: String,
  referrer: String,
  userAgent: String,
  ipAddress: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

eventSchema.index({ userId: 1, timestamp: -1 });
eventSchema.index({ eventType: 1, timestamp: -1 });
eventSchema.index({ sessionId: 1 });

export const Event = mongoose.model<IEvent>('Event', eventSchema);
