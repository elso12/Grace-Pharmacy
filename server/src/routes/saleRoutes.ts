import { Router } from 'express';
import { posCheckout } from '../controllers/saleController';
import { protect, authorizeRoles } from '../middleware/authMiddleware';
import { UserRole } from '../types/enums';

const router = Router();

// Routes for Cashiers/Admins at POS
router.post(
  '/checkout',
  protect,
  authorizeRoles(UserRole.CASHIER, UserRole.PHARMACIST, UserRole.ADMIN),
  posCheckout
);

export default router;
