import { ReviewModel } from '../models/review.model';
import { ProductRatingModel } from '../models/productRating.model';
import { logger } from '../utils/logger';
import { AppError } from '../utils/appError';
import { S3Service } from './s3.service';
import { SentimentAnalysisService } from './sentiment.service';
import { publishEvent } from '../config/rabbitmq';
import _ from 'lodash';

export class ReviewService {
  private s3Service: S3Service;
  private sentimentService: SentimentAnalysisService;

  constructor() {
    this.s3Service = new S3Service();
    this.sentimentService = new SentimentAnalysisService();
  }

  async createReview(data: {
    productId: string;
    userId: string;
    orderId: string;
    rating: number;
    title: string;
    content: string;
    pros?: string[];
    cons?: string[];
    images?: string[];
    videos?: string[];
  }) {
    try {
      // Check if user already reviewed this product for this order
      const existingReview = await ReviewModel.findOne({
        productId: data.productId,
        userId: data.userId,
        orderId: data.orderId
      });

      if (existingReview) {
        throw new AppError('You have already reviewed this product', 400);
      }

      // Perform sentiment analysis
      const sentiment = await this.sentimentService.analyzeSentiment(data.content);

      // Create review
      const review = await ReviewModel.create({
        ...data,
        sentiment: sentiment.score,
        sentimentLabel: sentiment.label,
        verified: true, // Verified purchase
        helpful: 0,
        notHelpful: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Update product rating
      await this.updateProductRating(data.productId);

      await publishEvent('review.created', {
        reviewId: review._id,
        productId: data.productId,
        userId: data.userId,
        rating: data.rating
      });

      logger.info(`Review created: ${review._id}`);

      return review;
    } catch (error: any) {
      logger.error('Review creation failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async getReview(reviewId: string) {
    try {
      const review = await ReviewModel.findById(reviewId)
        .populate('userId', 'name avatar')
        .populate('replies.userId', 'name avatar');

      if (!review) {
        throw new AppError('Review not found', 404);
      }

      return review;
    } catch (error: any) {
      logger.error('Review retrieval failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async getProductReviews(
    productId: string,
    options: {
      page?: number;
      limit?: number;
      sortBy?: 'recent' | 'helpful' | 'rating_high' | 'rating_low';
      rating?: number;
      verified?: boolean;
    } = {}
  ) {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = 'recent',
        rating,
        verified
      } = options;

      const skip = (page - 1) * limit;

      // Build query
      const query: any = { productId };
      if (rating) query.rating = rating;
      if (verified !== undefined) query.verified = verified;

      // Build sort
      let sort: any = {};
      switch (sortBy) {
        case 'helpful':
          sort = { helpful: -1 };
          break;
        case 'rating_high':
          sort = { rating: -1, createdAt: -1 };
          break;
        case 'rating_low':
          sort = { rating: 1, createdAt: -1 };
          break;
        default:
          sort = { createdAt: -1 };
      }

      const reviews = await ReviewModel.find(query)
        .populate('userId', 'name avatar')
        .sort(sort)
        .skip(skip)
        .limit(limit);

      const total = await ReviewModel.countDocuments(query);

      return {
        reviews,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error: any) {
      logger.error('Product reviews retrieval failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async getUserReviews(userId: string, page: number = 1, limit: number = 20) {
    try {
      const skip = (page - 1) * limit;

      const reviews = await ReviewModel.find({ userId })
        .populate('productId', 'name images price')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await ReviewModel.countDocuments({ userId });

      return {
        reviews,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error: any) {
      logger.error('User reviews retrieval failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async updateReview(
    reviewId: string,
    userId: string,
    updates: {
      rating?: number;
      title?: string;
      content?: string;
      pros?: string[];
      cons?: string[];
    }
  ) {
    try {
      const review = await ReviewModel.findOne({
        _id: reviewId,
        userId
      });

      if (!review) {
        throw new AppError('Review not found or access denied', 404);
      }

      // Update sentiment if content changed
      if (updates.content) {
        const sentiment = await this.sentimentService.analyzeSentiment(updates.content);
        updates['sentiment'] = sentiment.score;
        updates['sentimentLabel'] = sentiment.label;
      }

      const updatedReview = await ReviewModel.findByIdAndUpdate(
        reviewId,
        {
          ...updates,
          updatedAt: new Date()
        },
        { new: true }
      ).populate('userId', 'name avatar');

      // Update product rating if rating changed
      if (updates.rating) {
        await this.updateProductRating(review.productId);
      }

      await publishEvent('review.updated', {
        reviewId,
        productId: review.productId,
        userId
      });

      logger.info(`Review updated: ${reviewId}`);

      return updatedReview;
    } catch (error: any) {
      logger.error('Review update failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async deleteReview(reviewId: string, userId: string) {
    try {
      const review = await ReviewModel.findOne({
        _id: reviewId,
        userId
      });

      if (!review) {
        throw new AppError('Review not found or access denied', 404);
      }

      await ReviewModel.findByIdAndDelete(reviewId);

      // Update product rating
      await this.updateProductRating(review.productId);

      await publishEvent('review.deleted', {
        reviewId,
        productId: review.productId,
        userId
      });

      logger.info(`Review deleted: ${reviewId}`);
    } catch (error: any) {
      logger.error('Review deletion failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async markHelpful(reviewId: string, userId: string, helpful: boolean) {
    try {
      const review = await ReviewModel.findById(reviewId);

      if (!review) {
        throw new AppError('Review not found', 404);
      }

      // Check if user already marked this review
      const alreadyMarked = review.helpfulVotes?.includes(userId) || 
                           review.notHelpfulVotes?.includes(userId);

      if (alreadyMarked) {
        throw new AppError('You have already voted on this review', 400);
      }

      const update: any = {};
      if (helpful) {
        update.$inc = { helpful: 1 };
        update.$push = { helpfulVotes: userId };
      } else {
        update.$inc = { notHelpful: 1 };
        update.$push = { notHelpfulVotes: userId };
      }

      await ReviewModel.findByIdAndUpdate(reviewId, update);

      logger.info(`Review marked as ${helpful ? 'helpful' : 'not helpful'}: ${reviewId}`);
    } catch (error: any) {
      logger.error('Mark helpful failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async addReply(reviewId: string, userId: string, content: string) {
    try {
      const review = await ReviewModel.findById(reviewId);

      if (!review) {
        throw new AppError('Review not found', 404);
      }

      const reply = {
        userId,
        content,
        createdAt: new Date()
      };

      await ReviewModel.findByIdAndUpdate(reviewId, {
        $push: { replies: reply }
      });

      await publishEvent('review.reply_added', {
        reviewId,
        userId,
        productId: review.productId
      });

      logger.info(`Reply added to review: ${reviewId}`);

      return reply;
    } catch (error: any) {
      logger.error('Add reply failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async reportReview(reviewId: string, userId: string, reason: string) {
    try {
      const review = await ReviewModel.findById(reviewId);

      if (!review) {
        throw new AppError('Review not found', 404);
      }

      await ReviewModel.findByIdAndUpdate(reviewId, {
        $push: {
          reports: {
            userId,
            reason,
            createdAt: new Date()
          }
        }
      });

      await publishEvent('review.reported', {
        reviewId,
        reportedBy: userId,
        reason
      });

      logger.info(`Review reported: ${reviewId}`);
    } catch (error: any) {
      logger.error('Report review failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async uploadReviewMedia(file: Express.Multer.File, userId: string) {
    try {
      const uploadResult = await this.s3Service.uploadFile(file, 'review-media');

      return {
        url: uploadResult.url,
        key: uploadResult.key,
        type: file.mimetype
      };
    } catch (error: any) {
      logger.error('Review media upload failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async getProductRatingSummary(productId: string) {
    try {
      const summary = await ProductRatingModel.findOne({ productId });

      if (!summary) {
        return {
          productId,
          averageRating: 0,
          totalReviews: 0,
          ratingDistribution: {
            5: 0,
            4: 0,
            3: 0,
            2: 0,
            1: 0
          }
        };
      }

      return summary;
    } catch (error: any) {
      logger.error('Product rating summary retrieval failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async updateProductRating(productId: string) {
    try {
      const reviews = await ReviewModel.find({ productId });

      if (reviews.length === 0) {
        await ProductRatingModel.findOneAndUpdate(
          { productId },
          {
            productId,
            averageRating: 0,
            totalReviews: 0,
            ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
          },
          { upsert: true }
        );
        return;
      }

      const totalReviews = reviews.length;
      const averageRating = _.meanBy(reviews, 'rating');

      const ratingDistribution = {
        5: reviews.filter(r => r.rating === 5).length,
        4: reviews.filter(r => r.rating === 4).length,
        3: reviews.filter(r => r.rating === 3).length,
        2: reviews.filter(r => r.rating === 2).length,
        1: reviews.filter(r => r.rating === 1).length
      };

      await ProductRatingModel.findOneAndUpdate(
        { productId },
        {
          productId,
          averageRating: parseFloat(averageRating.toFixed(2)),
          totalReviews,
          ratingDistribution,
          updatedAt: new Date()
        },
        { upsert: true }
      );

      logger.info(`Product rating updated: ${productId}`);
    } catch (error: any) {
      logger.error('Product rating update failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async getReviewStats(productId: string) {
    try {
      const reviews = await ReviewModel.find({ productId });

      if (reviews.length === 0) {
        return {
          totalReviews: 0,
          averageRating: 0,
          verifiedPurchases: 0,
          withImages: 0,
          withVideos: 0,
          sentimentBreakdown: {
            positive: 0,
            neutral: 0,
            negative: 0
          }
        };
      }

      const totalReviews = reviews.length;
      const averageRating = _.meanBy(reviews, 'rating');
      const verifiedPurchases = reviews.filter(r => r.verified).length;
      const withImages = reviews.filter(r => r.images && r.images.length > 0).length;
      const withVideos = reviews.filter(r => r.videos && r.videos.length > 0).length;

      const sentimentBreakdown = {
        positive: reviews.filter(r => r.sentimentLabel === 'positive').length,
        neutral: reviews.filter(r => r.sentimentLabel === 'neutral').length,
        negative: reviews.filter(r => r.sentimentLabel === 'negative').length
      };

      return {
        totalReviews,
        averageRating: parseFloat(averageRating.toFixed(2)),
        verifiedPurchases,
        withImages,
        withVideos,
        sentimentBreakdown
      };
    } catch (error: any) {
      logger.error('Review stats retrieval failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async getTopReviewers(limit: number = 10) {
    try {
      const topReviewers = await ReviewModel.aggregate([
        {
          $group: {
            _id: '$userId',
            reviewCount: { $sum: 1 },
            avgRating: { $avg: '$rating' },
            totalHelpful: { $sum: '$helpful' }
          }
        },
        {
          $sort: { reviewCount: -1, totalHelpful: -1 }
        },
        {
          $limit: limit
        }
      ]);

      return topReviewers;
    } catch (error: any) {
      logger.error('Top reviewers retrieval failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async getMostHelpfulReviews(productId: string, limit: number = 5) {
    try {
      const reviews = await ReviewModel.find({ productId })
        .populate('userId', 'name avatar')
        .sort({ helpful: -1 })
        .limit(limit);

      return reviews;
    } catch (error: any) {
      logger.error('Most helpful reviews retrieval failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async searchReviews(query: string, productId?: string) {
    try {
      const searchQuery: any = {
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { content: { $regex: query, $options: 'i' } }
        ]
      };

      if (productId) {
        searchQuery.productId = productId;
      }

      const reviews = await ReviewModel.find(searchQuery)
        .populate('userId', 'name avatar')
        .populate('productId', 'name images')
        .sort({ createdAt: -1 })
        .limit(50);

      return reviews;
    } catch (error: any) {
      logger.error('Review search failed:', error);
      throw new AppError(error.message, 500);
    }
  }
}
