import { Router } from 'express';
import { posCheckout, refundSale } from '../controllers/saleController';
import { protect, authorizeRoles } from '../middleware/authMiddleware';
import { UserRole } from '../types/enums';

const router = Router();

// Routes for Cashiers/Admins at POS
router.post(
  '/pos',
  protect,
  authorizeRoles(UserRole.CASHIER, UserRole.PHARMACIST, UserRole.ADMIN),
  posCheckout
);

// Process a refund
router.post(
  '/:id/refund',
  protect,
  authorizeRoles(UserRole.CASHIER, UserRole.PHARMACIST, UserRole.ADMIN),
  refundSale
);

export default router;
