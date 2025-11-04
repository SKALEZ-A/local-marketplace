import { Request, Response, NextFunction } from 'express';
import { ElasticsearchService } from '../services/elasticsearch.service';
import { logger } from '../utils/logger';

export class SearchController {
  private elasticsearchService: ElasticsearchService;

  constructor() {
    this.elasticsearchService = new ElasticsearchService();
  }

  search = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const searchQuery = req.body;
      const results = await this.elasticsearchService.search(searchQuery);

      res.status(200).json({
        success: true,
        data: results
      });
    } catch (error) {
      logger.error('Error performing search:', error);
      next(error);
    }
  };

  autocomplete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { query } = req.query;
      const suggestions = await this.elasticsearchService.autocomplete(query as string);

      res.status(200).json({
        success: true,
        data: suggestions
      });
    } catch (error) {
      logger.error('Error getting autocomplete suggestions:', error);
      next(error);
    }
  };

  getPopularSearches = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { limit = 10 } = req.query;
      const popular = await this.elasticsearchService.getPopularSearches(Number(limit));

      res.status(200).json({
        success: true,
        data: popular
      });
    } catch (error) {
      logger.error('Error fetching popular searches:', error);
      next(error);
    }
  };
}
