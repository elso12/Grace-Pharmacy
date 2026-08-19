import { Router } from 'express';
import { getAuditLogs } from '../controllers/auditController';

const router = Router();

// Protected by strictAdminGuard
router.get('/', getAuditLogs);

export default router;
