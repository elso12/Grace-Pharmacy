import { Router } from 'express';
import { getClaims, submitClaim, adjudicateClaim, getInsuranceSummary } from '../controllers/insuranceController';
import { protect, authorizeRoles } from '../middleware/authMiddleware';
import { UserRole } from '../types/enums';

const router = Router();

router.use(protect);
router.use(authorizeRoles(UserRole.ADMIN, UserRole.PHARMACIST));

router.get('/summary', getInsuranceSummary);
router.get('/claims', getClaims);
router.post('/claims/submit', submitClaim);
router.patch('/claims/:id/adjudicate', adjudicateClaim);

export default router;
