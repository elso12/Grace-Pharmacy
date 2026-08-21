import { Router } from 'express';
import { getUsers, getUserById, updateUser, toggleUserStatus, createUser, resetPassword } from '../controllers/userController';

const router = Router();

// Routes are already protected by strictAdminGuard in app.ts
router.get('/', getUsers);
router.post('/', createUser);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.patch('/:id/status', toggleUserStatus);
router.post('/:id/reset-password', resetPassword);

export default router;
