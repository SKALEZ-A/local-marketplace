import { Router } from 'express';
import { SearchController } from '../controllers/search.controller';
import { validateSearchQuery } from '../validators/search.validator';

const router = Router();
const searchController = new SearchController();

router.get('/products', validateSearchQuery, searchController.searchProducts);
router.get('/suggestions', searchController.getSearchSuggestions);
router.get('/autocomplete', searchController.autocomplete);
router.get('/trending', searchController.getTrendingSearches);
router.get('/categories', searchController.searchCategories);
router.get('/sellers', searchController.searchSellers);
router.post('/index/product', searchController.indexProduct);
router.put('/index/product/:productId', searchController.updateProductIndex);
router.delete('/index/product/:productId', searchController.removeProductIndex);
router.post('/reindex', searchController.reindexAll);
router.get('/filters', searchController.getAvailableFilters);

export default router;
