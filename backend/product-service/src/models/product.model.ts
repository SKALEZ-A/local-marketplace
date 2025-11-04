import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  title: string;
  description: string;
  price: number;
  currency: string;
  category: {
    id: string;
    name: string;
    path: string;
  };
  seller: {
    id: string;
    name: string;
    rating: number;
  };
  images: Array<{
    url: string;
    thumbnail: string;
    alt: string;
  }>;
  attributes: {
    brand?: string;
    color?: string;
    size?: string;
    weight?: number;
    dimensions?: {
      length: number;
      width: number;
      height: number;
    };
  };
  variants: Array<{
    id: string;
    name: string;
    price: number;
    sku: string;
  }>;
  location: {
    type: string;
    coordinates: [number, number];
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };
  seo: {
    slug: string;
    metaTitle: string;
    metaDescription: string;
    keywords: string[];
  };
  status: 'active' | 'inactive' | 'out_of_stock';
  arEnabled: boolean;
  arModelUrl?: string;
  views: number;
  clicks: number;
  rating: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    description: {
      type: String,
      required: true,
      maxlength: 5000
    },
    price: {
      type: Number,
      required: true,
      min: 0.01,
      max: 1000000
    },
    currency: {
      type: String,
      default: 'USD',
      enum: ['USD', 'EUR', 'GBP', 'CAD']
    },
    category: {
      id: { type: String, required: true },
      name: { type: String, required: true },
      path: { type: String, required: true }
    },
    seller: {
      id: { type: String, required: true, index: true },
      name: { type: String, required: true },
      rating: { type: Number, default: 0 }
    },
    images: [
      {
        url: { type: String, required: true },
        thumbnail: { type: String, required: true },
        alt: { type: String }
      }
    ],
    attributes: {
      brand: String,
      color: String,
      size: String,
      weight: Number,
      dimensions: {
        length: Number,
        width: Number,
        height: Number
      }
    },
    variants: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        sku: { type: String, required: true }
      }
    ],
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        required: true,
        index: '2dsphere'
      },
      address: String,
      city: String,
      state: String,
      zipCode: String
    },
    seo: {
      slug: {
        type: String,
        unique: true,
        sparse: true
      },
      metaTitle: String,
      metaDescription: String,
      keywords: [String]
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'out_of_stock'],
      default: 'active',
      index: true
    },
    arEnabled: {
      type: Boolean,
      default: false
    },
    arModelUrl: String,
    views: {
      type: Number,
      default: 0
    },
    clicks: {
      type: Number,
      default: 0
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    reviewCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Indexes
ProductSchema.index({ title: 'text', description: 'text' });
ProductSchema.index({ 'category.id': 1, status: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ rating: -1 });
ProductSchema.index({ createdAt: -1 });

// Virtual for full location
ProductSchema.virtual('fullLocation').get(function () {
  return `${this.location.address}, ${this.location.city}, ${this.location.state} ${this.location.zipCode}`;
});

export default mongoose.model<IProduct>('Product', ProductSchema);
