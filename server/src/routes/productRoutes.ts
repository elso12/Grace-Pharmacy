import { Router } from 'express';
import { 
  getProducts, 
  getProductById, 
  createProduct,
  updateProduct,
  deleteProduct,
  updateShelfLocation 
} from '../controllers/productController';
import { protect, authorizeRoles } from '../middleware/authMiddleware';
import { UserRole } from '../types/enums';
import { validateRequest } from '../middleware/validate';
import {
  createProductSchema,
  updateProductSchema,
  queryProductSchema,
} from '../validations/product.validation';

const router = Router();

// ─── Public Storefront Routes ───────────────────────────────────────────────
// GET endpoints are public so the B2C storefront can display the catalog
router.get('/', validateRequest(queryProductSchema), getProducts);
router.get('/:id', getProductById);

// ─── Admin Internal Routes ──────────────────────────────────────────────────
// Protected routes for Admin and Pharmacist to manage medications
router.post(
  '/',
  protect,
  authorizeRoles(UserRole.ADMIN, UserRole.PHARMACIST),
  validateRequest(createProductSchema),
  createProduct
);

router.put(
  '/:id',
  protect,
  authorizeRoles(UserRole.ADMIN, UserRole.PHARMACIST),
  validateRequest(updateProductSchema),
  updateProduct
);

router.delete(
  '/:id',
  protect,
  authorizeRoles(UserRole.ADMIN, UserRole.PHARMACIST),
  deleteProduct
);

// Specific shelf location update accessible by technicians too
router.put(
  '/:id/location',
  protect,
  authorizeRoles(UserRole.ADMIN, UserRole.PHARMACIST, UserRole.TECHNICIAN),
  updateShelfLocation
);

export default router;
