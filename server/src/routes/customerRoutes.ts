import { Router } from 'express';
import { getProfile, updateProfile } from '../controllers/customerController';
import { protect, authorizeRoles } from '../middleware/authMiddleware';
import { UserRole } from '../types/enums';

const router: Router = Router();

// Ensure all customer routes require authentication and only CUSTOMER/ADMIN roles can access
router.use(protect);
router.use(authorizeRoles(UserRole.CUSTOMER, UserRole.ADMIN));

router.get('/profile', getProfile);
router.put('/profile', updateProfile);

export default router;
