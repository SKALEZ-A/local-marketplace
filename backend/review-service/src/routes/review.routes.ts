import { Router } from 'express';
import { ReviewController } from '../controllers/review.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateReview, validateReviewUpdate } from '../validators/review.validator';

const router = Router();
const reviewController = new ReviewController();

router.get('/product/:productId', reviewController.getProductReviews);
router.get('/seller/:sellerId', reviewController.getSellerReviews);
router.get('/:reviewId', reviewController.getReview);

router.use(authMiddleware);

router.post('/', validateReview, reviewController.createReview);
router.put('/:reviewId', validateReviewUpdate, reviewController.updateReview);
router.delete('/:reviewId', reviewController.deleteReview);
router.post('/:reviewId/helpful', reviewController.markHelpful);
router.post('/:reviewId/report', reviewController.reportReview);
router.post('/:reviewId/reply', reviewController.replyToReview);
router.get('/user/my-reviews', reviewController.getUserReviews);
router.get('/product/:productId/summary', reviewController.getReviewSummary);

export default router;
