import { Router } from 'express';
import { getTransfers, requestTransfer, dispatchTransfer, receiveTransfer } from '../controllers/transferController';
import { protect, authorizeRoles } from '../middleware/authMiddleware';
import { UserRole } from '../types/enums';

const router = Router();

router.use(protect);
router.use(authorizeRoles(UserRole.ADMIN, UserRole.PHARMACIST));

router.get('/', getTransfers);
router.post('/request', requestTransfer);
router.patch('/:id/dispatch', dispatchTransfer);
router.patch('/:id/receive', receiveTransfer);

export default router;
