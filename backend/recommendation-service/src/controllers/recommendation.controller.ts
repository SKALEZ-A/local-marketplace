import { Request, Response, NextFunction } from 'express';
import { RecommendationService } from '../services/recommendation.service';

export class RecommendationController {
  private recommendationService: RecommendationService;

  constructor() {
    this.recommendationService = new RecommendationService();
  }

  getProductRecommendations = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      const { limit, category } = req.query;
      
      const recommendations = await this.recommendationService.getProductRecommendations(
        userId,
        { limit: Number(limit), category }
      );
      
      res.status(200).json({
        success: true,
        data: recommendations
      });
    } catch (error) {
      next(error);
    }
  };

  getSimilarProducts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { productId } = req.params;
      const { limit = 10 } = req.query;
      
      const products = await this.recommendationService.getSimilarProducts(
        productId,
        Number(limit)
      );
      
      res.status(200).json({
        success: true,
        data: products
      });
    } catch (error) {
      next(error);
    }
  };

  getTrendingProducts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { limit = 10 } = req.query;
      const products = await this.recommendationService.getTrendingProducts(Number(limit));
      
      res.status(200).json({
        success: true,
        data: products
      });
    } catch (error) {
      next(error);
    }
  };

  getPersonalizedRecommendations = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      const { limit = 10 } = req.query;
      
      const recommendations = await this.recommendationService.getPersonalizedRecommendations(
        userId,
        Number(limit)
      );
      
      res.status(200).json({
        success: true,
        data: recommendations
      });
    } catch (error) {
      next(error);
    }
  };

  getFrequentlyBoughtTogether = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { productId } = req.params;
      const { limit = 5 } = req.query;
      
      const products = await this.recommendationService.getFrequentlyBoughtTogether(
        productId,
        Number(limit)
      );
      
      res.status(200).json({
        success: true,
        data: products
      });
    } catch (error) {
      next(error);
    }
  };

  getRecentlyViewed = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(200).json({
        success: true,
        data: []
      });
    } catch (error) {
      next(error);
    }
  };

  trackProductView = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      const { productId } = req.body;
      
      await this.recommendationService.trackProductView(userId, productId);
      
      res.status(200).json({
        success: true,
        message: 'View tracked'
      });
    } catch (error) {
      next(error);
    }
  };

  trackInteraction = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(200).json({
        success: true,
        message: 'Interaction tracked'
      });
    } catch (error) {
      next(error);
    }
  };

  getRecommendedCategories = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(200).json({
        success: true,
        data: []
      });
    } catch (error) {
      next(error);
    }
  };

  getRecommendedSellers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(200).json({
        success: true,
        data: []
      });
    } catch (error) {
      next(error);
    }
  };
}
