import { Router } from 'express';
import { getTaxReport, getControlledSubstancesAudit } from '../controllers/complianceController';

const router = Router();

router.get('/tax-report', getTaxReport);
router.get('/controlled-substances', getControlledSubstancesAudit);

export default router;
