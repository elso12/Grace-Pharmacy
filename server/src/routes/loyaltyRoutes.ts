import { Router } from 'express';
import { redeemPoints, getLoyaltyBalance } from '../controllers/loyaltyController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.use(protect); // Applies to all routes (Customers can use it)

router.get('/balance', getLoyaltyBalance);
router.post('/redeem', redeemPoints);

export default router;
