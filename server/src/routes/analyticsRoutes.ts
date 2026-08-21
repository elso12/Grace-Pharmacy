import { Router } from 'express';
import { getAnalyticsSummary, getFinancialSummary, exportReport } from '../controllers/analyticsController';
// In a real app we would import auth/RBAC middleware here.
// Assuming open access or handled higher up for this portfolio project.

const router = Router();

router.get('/dashboard', getAnalyticsSummary);
router.get('/financial-summary', getFinancialSummary);
router.get('/export', exportReport);

export default router;
