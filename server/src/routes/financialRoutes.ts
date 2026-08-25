import { Router } from 'express';
import { getPnLStatement, logExpense } from '../controllers/financialController';
import { protect, authorizeRoles } from '../middleware/authMiddleware';
import { UserRole } from '../types/enums';

const router = Router();

router.use(protect);
router.use(authorizeRoles(UserRole.ADMIN));

router.get('/pnl-statement', getPnLStatement);
router.post('/expenses', logExpense);

export default router;
