export interface UserPreference {
  userId: string;
  categories: string[];
  priceRange: {
    min: number;
    max: number;
  };
  brands: string[];
  viewedProducts: string[];
  purchasedProducts: string[];
  searchHistory: string[];
  lastUpdated: Date;
}

export interface Recommendation {
  productId: string;
  score: number;
  reason: string;
  type: 'collaborative' | 'content_based' | 'trending' | 'personalized' | 'similar';
  metadata?: {
    similarUsers?: string[];
    commonFeatures?: string[];
    trendingScore?: number;
  };
}

export interface RecommendationRequest {
  userId?: string;
  productId?: string;
  limit?: number;
  type?: Recommendation['type'];
  excludeViewed?: boolean;
  excludePurchased?: boolean;
}

export interface RecommendationResponse {
  recommendations: Recommendation[];
  total: number;
  generatedAt: Date;
}

export interface SimilarProduct {
  productId: string;
  similarity: number;
  commonAttributes: string[];
}

export interface TrendingProduct {
  productId: string;
  trendScore: number;
  views: number;
  purchases: number;
  period: '24h' | '7d' | '30d';
}
