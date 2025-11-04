export interface Review {
  id: string;
  productId: string;
  orderId: string;
  userId: string;
  rating: number;
  title?: string;
  content: string;
  media: ReviewMedia[];
  verifiedPurchase: boolean;
  helpfulCount: number;
  notHelpfulCount: number;
  response?: SellerResponse;
  status: ReviewStatus;
  moderationNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReviewMedia {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
}

export interface SellerResponse {
  sellerId: string;
  content: string;
  createdAt: Date;
}

export type ReviewStatus = 'pending' | 'published' | 'rejected';

export interface ReviewInput {
  productId: string;
  orderId: string;
  rating: number;
  title?: string;
  content: string;
}

export interface ReviewAggregation {
  average: number;
  weighted: number;
  count: number;
  distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

export interface ReviewFilters {
  productId?: string;
  userId?: string;
  rating?: number;
  verifiedPurchase?: boolean;
  sortBy?: 'helpful' | 'recent' | 'rating';
}
