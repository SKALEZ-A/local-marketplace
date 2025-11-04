export interface SearchQuery {
  query: string;
  filters?: {
    category?: string[];
    priceRange?: { min: number; max: number };
    location?: string;
    condition?: string[];
    rating?: number;
  };
  sort?: {
    field: string;
    order: 'asc' | 'desc';
  };
  pagination?: {
    page: number;
    limit: number;
  };
}

export interface SearchResult {
  id: string;
  type: 'product' | 'seller' | 'category';
  score: number;
  data: any;
}

export interface SearchHistory {
  userId: string;
  query: string;
  filters?: any;
  timestamp: Date;
}

export class SearchModel {
  private searchHistory: SearchHistory[] = [];

  async saveSearchHistory(userId: string, query: string, filters?: any): Promise<void> {
    this.searchHistory.push({
      userId,
      query,
      filters,
      timestamp: new Date()
    });
  }

  async getUserSearchHistory(userId: string, limit: number = 10): Promise<SearchHistory[]> {
    return this.searchHistory
      .filter(h => h.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  async getPopularSearches(limit: number = 10): Promise<{ query: string; count: number }[]> {
    const queryCount = new Map<string, number>();
    
    this.searchHistory.forEach(h => {
      const count = queryCount.get(h.query) || 0;
      queryCount.set(h.query, count + 1);
    });

    return Array.from(queryCount.entries())
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }
}
