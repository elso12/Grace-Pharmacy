import { Router } from 'express';
import { createOrder, getCustomerOrders, updateOrderStatus, approvePrescriptionOrder, getPendingPrescriptionOrders, getReadyToPackOrders, getAllOrders, getOrderById } from '../controllers/orderController';
import { protect, authorizeRoles } from '../middleware/authMiddleware';
import { UserRole } from '../types/enums';
import { validateRequest } from '../middleware/validate';
import {
  checkoutSchema,
  updateOrderStatusSchema,
} from '../validations/order.validation';

const router = Router();

// Routes for Customers
router.post('/checkout', protect, authorizeRoles(UserRole.CUSTOMER, UserRole.ADMIN), validateRequest(checkoutSchema), createOrder);
router.get('/customer', protect, authorizeRoles(UserRole.CUSTOMER, UserRole.ADMIN), getCustomerOrders);
router.get('/customer/:id', protect, authorizeRoles(UserRole.CUSTOMER, UserRole.ADMIN), getOrderById);

// Routes for Admin/Pharmacist/Technician Routes
router.patch(
  '/:id/status',
  protect,
  authorizeRoles(UserRole.ADMIN, UserRole.PHARMACIST, UserRole.TECHNICIAN),
  validateRequest(updateOrderStatusSchema),
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

router.get(
  '/',
  protect,
  authorizeRoles(UserRole.ADMIN, UserRole.PHARMACIST),
  getAllOrders
);

export default router;
