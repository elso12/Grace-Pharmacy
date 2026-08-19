import { Router } from 'express';
import { createOrder, getCustomerOrders, updateOrderStatus, approvePrescriptionOrder, getPendingPrescriptionOrders, getReadyToPackOrders } from '../controllers/orderController';
import { protect, authorizeRoles } from '../middleware/authMiddleware';
import { UserRole } from '../types/enums';

const router = Router();

// Routes for Customers
router.post('/checkout', protect, authorizeRoles(UserRole.CUSTOMER), createOrder);
router.get('/my-orders', protect, authorizeRoles(UserRole.CUSTOMER), getCustomerOrders);

// Routes for Admin/Pharmacist/Technician Routes
router.patch(
  '/:id/status',
  protect,
  authorizeRoles(UserRole.ADMIN, UserRole.PHARMACIST, UserRole.TECHNICIAN),
  updateOrderStatus
);

router.get(
  '/ready-to-pack',
  protect,
  authorizeRoles(UserRole.ADMIN, UserRole.PHARMACIST, UserRole.TECHNICIAN),
  getReadyToPackOrders
);

router.get(
  '/pending-approval',
  protect,
  authorizeRoles(UserRole.ADMIN, UserRole.PHARMACIST),
  getPendingPrescriptionOrders
);

router.patch(
  '/:id/approve',
  protect,
  authorizeRoles(UserRole.ADMIN, UserRole.PHARMACIST),
  approvePrescriptionOrder
);

export default router;
