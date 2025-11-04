export interface SearchFilters {
  category?: string[];
  priceRange?: {
    min: number;
    max: number;
  };
  location?: string;
  condition?: ('new' | 'used' | 'refurbished')[];
  rating?: number;
  inStock?: boolean;
  freeShipping?: boolean;
  brands?: string[];
}

export interface SearchSort {
  field: 'relevance' | 'price' | 'rating' | 'date' | 'popularity';
  order: 'asc' | 'desc';
}

export interface SearchPagination {
  page: number;
  limit: number;
  total?: number;
}

export interface SearchQuery {
  query: string;
  filters?: SearchFilters;
  sort?: SearchSort;
  pagination?: SearchPagination;
}

export interface SearchResult {
  id: string;
  type: 'product' | 'seller' | 'category';
  score: number;
  data: any;
  highlights?: {
    field: string;
    snippet: string;
  }[];
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  page: number;
  limit: number;
  facets?: {
    categories: { name: string; count: number }[];
    brands: { name: string; count: number }[];
    priceRanges: { range: string; count: number }[];
  };
  suggestions?: string[];
}

export interface SearchHistory {
  userId: string;
  query: string;
  filters?: SearchFilters;
  timestamp: Date;
  resultsCount: number;
}
