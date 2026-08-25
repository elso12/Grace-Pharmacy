import { Router } from 'express';
import { 
  clockIn, 
  clockOut, 
  getMyShifts, 
  getAllTimesheets, 
  approveTimesheet, 
  getPayrollSummary 
} from '../controllers/timesheetController';
import { protect, authorizeRoles } from '../middleware/authMiddleware';
import { UserRole } from '../types/enums';

const router = Router();

router.use(protect);

router.post('/clock-in', clockIn);
router.post('/clock-out', clockOut);
router.get('/my-shifts', getMyShifts);

router.get('/admin', authorizeRoles(UserRole.ADMIN), getAllTimesheets);
router.get('/admin/payroll-summary', authorizeRoles(UserRole.ADMIN), getPayrollSummary);
router.patch('/admin/:id/approve', authorizeRoles(UserRole.ADMIN), approveTimesheet);

export default router;
