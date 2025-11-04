import { Coordinates } from './common.types';

export interface Product {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  category: Category;
  subcategory?: string;
  images: ProductImage[];
  attributes: Record<string, any>;
  variants?: ProductVariant[];
  specifications: Specification[];
  dimensions?: ProductDimensions;
  location: ProductLocation;
  seo: ProductSEO;
  ar: ARConfiguration;
  status: ProductStatus;
  featured: boolean;
  featuredUntil?: Date;
  views: number;
  clicks: number;
  sales: number;
  rating?: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductImage {
  id: string;
  url: string;
  thumbnail: string;
  alt: string;
  order: number;
  embedding?: number[];
}

export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  price: number;
  attributes: Record<string, string>;
  inventory: number;
  images?: string[];
}

export interface Category {
  id: string;
  name: string;
  path: string;
  level: number;
  parentId?: string;
}

export interface Specification {
  name: string;
  value: string;
}

export interface ProductDimensions {
  length: number;
  width: number;
  height: number;
  weight: number;
  unit: string;
}

export interface ProductLocation {
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface ProductSEO {
  slug: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
}

export interface ARConfiguration {
  enabled: boolean;
  modelUrl?: string;
  modelFormat?: 'gltf' | 'usdz';
  thumbnailUrl?: string;
}

export type ProductStatus = 'draft' | 'active' | 'inactive' | 'out_of_stock';

export interface ProductInput {
  title: string;
  description: string;
  price: number;
  currency?: string;
  category: string;
  subcategory?: string;
  attributes?: Record<string, any>;
  specifications?: Specification[];
  dimensions?: ProductDimensions;
  location: ProductLocation;
  arEnabled?: boolean;
}

export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  location?: Coordinates;
  radius?: number;
  inStock?: boolean;
  rating?: number;
  sellerId?: string;
  featured?: boolean;
}
