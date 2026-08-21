import { Router } from 'express';
import { protect } from '../middleware/authMiddleware';
import { getContacts, getThread, sendMessage, markAsRead } from '../controllers/messageController';

const router = Router();

// All message routes require authentication
router.use(protect);

router.get('/contacts', getContacts);
router.get('/thread/:otherUserId', getThread);
router.post('/send', sendMessage);
router.patch('/read/:otherUserId', markAsRead);

export default router;
