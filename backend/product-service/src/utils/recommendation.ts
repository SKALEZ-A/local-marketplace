import { logger } from './logger';

export interface ProductRecommendation {
  productId: string;
  score: number;
  reason: string;
}

export interface UserBehavior {
  userId: string;
  viewedProducts: string[];
  purchasedProducts: string[];
  searchQueries: string[];
  categories: string[];
}

export class RecommendationEngine {
  private productSimilarity: Map<string, Map<string, number>> = new Map();
  private userPreferences: Map<string, UserBehavior> = new Map();

  calculateCollaborativeFiltering(
    userId: string,
    allUsers: UserBehavior[],
    limit: number = 10
  ): ProductRecommendation[] {
    const userBehavior = this.userPreferences.get(userId);
    if (!userBehavior) return [];

    const similarUsers = this.findSimilarUsers(userBehavior, allUsers);
    const recommendations = new Map<string, number>();

    similarUsers.forEach(({ user, similarity }) => {
      user.purchasedProducts.forEach(productId => {
        if (!userBehavior.purchasedProducts.includes(productId)) {
          const currentScore = recommendations.get(productId) || 0;
          recommendations.set(productId, currentScore + similarity);
        }
      });
    });

    return Array.from(recommendations.entries())
      .map(([productId, score]) => ({
        productId,
        score,
        reason: 'Users with similar preferences also bought this'
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  calculateContentBasedFiltering(
    productId: string,
    allProducts: any[],
    limit: number = 10
  ): ProductRecommendation[] {
    const similarities = this.productSimilarity.get(productId);
    if (!similarities) return [];

    return Array.from(similarities.entries())
      .map(([id, score]) => ({
        productId: id,
        score,
        reason: 'Similar to products you viewed'
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  calculateTrendingProducts(
    products: any[],
    timeWindow: number = 7 * 24 * 60 * 60 * 1000,
    limit: number = 10
  ): ProductRecommendation[] {
    const now = Date.now();
    
    return products
      .filter(p => now - new Date(p.createdAt).getTime() < timeWindow)
      .map(p => ({
        productId: p.id,
        score: (p.views || 0) * 0.3 + (p.purchases || 0) * 0.7,
        reason: 'Trending now'
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  private findSimilarUsers(
    targetUser: UserBehavior,
    allUsers: UserBehavior[]
  ): Array<{ user: UserBehavior; similarity: number }> {
    return allUsers
      .filter(u => u.userId !== targetUser.userId)
      .map(user => ({
        user,
        similarity: this.calculateUserSimilarity(targetUser, user)
      }))
      .filter(({ similarity }) => similarity > 0.3)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 20);
  }

  private calculateUserSimilarity(user1: UserBehavior, user2: UserBehavior): number {
    const viewedOverlap = this.calculateJaccardSimilarity(
      user1.viewedProducts,
      user2.viewedProducts
    );
    const purchasedOverlap = this.calculateJaccardSimilarity(
      user1.purchasedProducts,
      user2.purchasedProducts
    );
    const categoryOverlap = this.calculateJaccardSimilarity(
      user1.categories,
      user2.categories
    );

    return viewedOverlap * 0.3 + purchasedOverlap * 0.5 + categoryOverlap * 0.2;
  }

  private calculateJaccardSimilarity(set1: string[], set2: string[]): number {
    const s1 = new Set(set1);
    const s2 = new Set(set2);
    const intersection = new Set([...s1].filter(x => s2.has(x)));
    const union = new Set([...s1, ...s2]);
    
    return union.size === 0 ? 0 : intersection.size / union.size;
  }

  updateProductSimilarity(productId: string, similarProducts: Map<string, number>): void {
    this.productSimilarity.set(productId, similarProducts);
  }

  updateUserBehavior(userId: string, behavior: UserBehavior): void {
    this.userPreferences.set(userId, behavior);
  }
}
