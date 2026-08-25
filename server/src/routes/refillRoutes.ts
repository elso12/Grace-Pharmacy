import { Router } from 'express';
import { getRefillAlerts } from '../controllers/refillController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.use(protect);
router.get('/alerts', getRefillAlerts);

export default router;
