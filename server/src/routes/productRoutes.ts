import { Router } from 'express';
import { getProducts, getProductById, updateShelfLocation } from '../controllers/productController';
import { protect, authorizeRoles } from '../middleware/authMiddleware';
import { UserRole } from '../types/enums';

/**
 * ─── Public Storefront Product Routes ───────────────────────────────────────
 *
 * No authentication middleware is applied here — these endpoints are intentionally
 * public so the B2C storefront can display the product catalog without requiring
 * a user session.
 *
 * Mounted at: /api/products (see app.ts)
 *
 * GET /api/products        — list all products (supports ?category, ?search, ?requiresPrescription)
 * GET /api/products/:id    — fetch a single product by MongoDB ObjectId
 */
const router = Router();

router.get('/',    getProducts);
router.get('/:id', getProductById);

// ─── Internal Route for Staff ─────────────────────────────────────────────────
router.put(
  '/:id/location',
  protect,
  authorizeRoles(UserRole.ADMIN, UserRole.PHARMACIST, UserRole.TECHNICIAN),
  updateShelfLocation
);

export default router;
