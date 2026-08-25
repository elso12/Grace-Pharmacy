import { Router } from 'express';
import { autoGeneratePOs, getAllPOs, receivePOBatch, createVendorReturn } from '../controllers/procurementController';
import { protect, authorizeRoles } from '../middleware/authMiddleware';
import { UserRole } from '../types/enums';

const router = Router();

router.use(protect);
router.use(authorizeRoles(UserRole.ADMIN, UserRole.PHARMACIST));

router.get('/purchase-orders', getAllPOs);
router.post('/purchase-orders/auto-generate', autoGeneratePOs);
router.post('/purchase-orders/:id/receive', receivePOBatch);
router.post('/vendor-returns', createVendorReturn);

export default router;
