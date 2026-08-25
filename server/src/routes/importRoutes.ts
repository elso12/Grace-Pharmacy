import { Router } from 'express';
import multer from 'multer';
import { importProducts, importBatches } from '../controllers/importController';

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

router.post('/products', upload.single('file'), importProducts);
router.post('/batches', upload.single('file'), importBatches);

export default router;
