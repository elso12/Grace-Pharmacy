import { Router } from 'express';
import { getBranches, createBranch } from '../controllers/branchController';
import { protect, authorizeRoles } from '../middleware/authMiddleware';
import { UserRole } from '../types/enums';

const router = Router();

router.use(protect);

router.get('/', getBranches);
router.post('/', authorizeRoles(UserRole.ADMIN), createBranch);

export default router;
