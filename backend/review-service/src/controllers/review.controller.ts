import { Request, Response, NextFunction } from 'express';
import { ReviewService } from '../services/review.service';
import { logger } from '../utils/logger';

export class ReviewController {
  private reviewService: ReviewService;

  constructor() {
    this.reviewService = new ReviewService();
  }

  createReview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      const reviewData = { ...req.body, userId };
      const review = await this.reviewService.createReview(reviewData);

      res.status(201).json({
        success: true,
        message: 'Review created successfully',
        data: review
      });
    } catch (error) {
      logger.error('Error creating review:', error);
      next(error);
    }
  };

  getReview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const review = await this.reviewService.getReview(id);

      res.status(200).json({
        success: true,
        data: review
      });
    } catch (error) {
      logger.error('Error fetching review:', error);
      next(error);
    }
  };

  getProductReviews = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { productId } = req.params;
      const reviews = await this.reviewService.getProductReviews(productId);

      res.status(200).json({
        success: true,
        data: reviews
      });
    } catch (error) {
      logger.error('Error fetching product reviews:', error);
      next(error);
    }
  };
}
