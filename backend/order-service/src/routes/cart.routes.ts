import { Router } from 'express';
import { CartController } from '../controllers/cart.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateCartItem } from '../validators/cart.validator';

const router = Router();
const cartController = new CartController();

router.use(authMiddleware);

router.get('/', cartController.getCart);
router.post('/items', validateCartItem, cartController.addItem);
router.put('/items/:itemId', validateCartItem, cartController.updateItem);
router.delete('/items/:itemId', cartController.removeItem);
router.delete('/clear', cartController.clearCart);
router.post('/merge', cartController.mergeCart);
router.get('/summary', cartController.getCartSummary);
router.post('/apply-coupon', cartController.applyCoupon);
router.delete('/remove-coupon', cartController.removeCoupon);
router.post('/save-for-later/:itemId', cartController.saveForLater);
router.post('/move-to-cart/:itemId', cartController.moveToCart);

export default router;
