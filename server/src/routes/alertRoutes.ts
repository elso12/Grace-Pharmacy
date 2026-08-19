import { Router } from 'express';
import { getAlerts, updateAlertStatus } from '../controllers/alertController';

const router = Router();

router.route('/')
  .get(getAlerts);

router.route('/:id/status')
  .patch(updateAlertStatus);

export default router;
