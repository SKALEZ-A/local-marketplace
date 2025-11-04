import { Router } from 'express';
import { InventoryController } from '../controllers/inventory.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateInventoryUpdate } from '../validators/inventory.validator';

const router = Router();
const inventoryController = new InventoryController();

router.use(authMiddleware);

router.get('/product/:productId', inventoryController.getProductInventory);
router.put('/product/:productId', validateInventoryUpdate, inventoryController.updateInventory);
router.post('/product/:productId/reserve', inventoryController.reserveInventory);
router.post('/product/:productId/release', inventoryController.releaseInventory);
router.get('/low-stock', inventoryController.getLowStockProducts);
router.get('/out-of-stock', inventoryController.getOutOfStockProducts);
router.post('/bulk-update', inventoryController.bulkUpdateInventory);
router.get('/history/:productId', inventoryController.getInventoryHistory);

export default router;
