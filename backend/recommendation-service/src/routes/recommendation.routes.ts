import { Router } from 'express';
import { RecommendationController } from '../controllers/recommendation.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateRecommendationQuery } from '../validators/recommendation.validator';

const router = Router();
const recommendationController = new RecommendationController();

router.use(authMiddleware);

router.get('/products', validateRecommendationQuery, recommendationController.getProductRecommendations);
router.get('/similar/:productId', recommendationController.getSimilarProducts);
router.get('/trending', recommendationController.getTrendingProducts);
router.get('/personalized', recommendationController.getPersonalizedRecommendations);
router.get('/frequently-bought-together/:productId', recommendationController.getFrequentlyBoughtTogether);
router.get('/recently-viewed', recommendationController.getRecentlyViewed);
router.post('/track-view', recommendationController.trackProductView);
router.post('/track-interaction', recommendationController.trackInteraction);
router.get('/categories', recommendationController.getRecommendedCategories);
router.get('/sellers', recommendationController.getRecommendedSellers);

export default router;
