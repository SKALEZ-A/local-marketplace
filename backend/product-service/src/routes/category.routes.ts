import { Router } from 'express';
import { CategoryController } from '../controllers/category.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { cacheMiddleware } from '../middleware/cache.middleware';
import { validateCategory } from '../validators/category.validator';

const router = Router();
const categoryController = new CategoryController();

router.get('/', cacheMiddleware(3600), categoryController.getCategories);
router.get('/tree', cacheMiddleware(3600), categoryController.getCategoryTree);
router.get('/:categoryId', cacheMiddleware(3600), categoryController.getCategory);
router.get('/:categoryId/children', cacheMiddleware(3600), categoryController.getCategoryChildren);
router.get('/:categoryId/breadcrumb', cacheMiddleware(3600), categoryController.getCategoryBreadcrumb);

router.use(authMiddleware);

router.post('/', validateCategory, categoryController.createCategory);
router.put('/:categoryId', validateCategory, categoryController.updateCategory);
router.delete('/:categoryId', categoryController.deleteCategory);
router.post('/:categoryId/reorder', categoryController.reorderCategories);

export default router;
