export interface UserPreference {
  userId: string;
  categories: string[];
  priceRange: { min: number; max: number };
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
  type: 'collaborative' | 'content_based' | 'trending' | 'personalized';
}

export class RecommendationModel {
  private preferences: Map<string, UserPreference> = new Map();

  async getUserPreference(userId: string): Promise<UserPreference | null> {
    return this.preferences.get(userId) || null;
  }

  async updateUserPreference(userId: string, data: Partial<UserPreference>): Promise<UserPreference> {
    const existing = this.preferences.get(userId);
    const updated: UserPreference = {
      userId,
      categories: data.categories || existing?.categories || [],
      priceRange: data.priceRange || existing?.priceRange || { min: 0, max: 10000 },
      brands: data.brands || existing?.brands || [],
      viewedProducts: data.viewedProducts || existing?.viewedProducts || [],
      purchasedProducts: data.purchasedProducts || existing?.purchasedProducts || [],
      searchHistory: data.searchHistory || existing?.searchHistory || [],
      lastUpdated: new Date()
    };
    this.preferences.set(userId, updated);
    return updated;
  }

  async addViewedProduct(userId: string, productId: string): Promise<void> {
    const pref = await this.getUserPreference(userId);
    const viewedProducts = pref?.viewedProducts || [];
    if (!viewedProducts.includes(productId)) {
      viewedProducts.push(productId);
      await this.updateUserPreference(userId, { viewedProducts });
    }
  }

  async addPurchasedProduct(userId: string, productId: string): Promise<void> {
    const pref = await this.getUserPreference(userId);
    const purchasedProducts = pref?.purchasedProducts || [];
    if (!purchasedProducts.includes(productId)) {
      purchasedProducts.push(productId);
      await this.updateUserPreference(userId, { purchasedProducts });
    }
  }
}
