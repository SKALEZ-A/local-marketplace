import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { uploadMiddleware } from '../middleware/upload.middleware';
import { cacheMiddleware } from '../middleware/cache.middleware';
import { validateProduct, validateProductUpdate } from '../validators/product.validator';

const router = Router();
const productController = new ProductController();

router.get('/', cacheMiddleware(300), productController.getProducts);
router.get('/:productId', cacheMiddleware(600), productController.getProduct);
router.get('/slug/:slug', cacheMiddleware(600), productController.getProductBySlug);
router.get('/seller/:sellerId', cacheMiddleware(300), productController.getSellerProducts);
router.get('/category/:categoryId', cacheMiddleware(300), productController.getCategoryProducts);

router.use(authMiddleware);

router.post('/', uploadMiddleware.array('images', 10), validateProduct, productController.createProduct);
router.put('/:productId', uploadMiddleware.array('images', 10), validateProductUpdate, productController.updateProduct);
router.delete('/:productId', productController.deleteProduct);
router.post('/:productId/publish', productController.publishProduct);
router.post('/:productId/unpublish', productController.unpublishProduct);
router.post('/:productId/duplicate', productController.duplicateProduct);
router.get('/:productId/analytics', productController.getProductAnalytics);

export default router;
