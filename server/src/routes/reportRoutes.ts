import { Router } from 'express';
import { exportSalesCsv, exportInventoryPdf } from '../controllers/reportController';

const router = Router();

router.route('/sales/csv')
  .get(exportSalesCsv);

router.route('/inventory/pdf')
  .get(exportInventoryPdf);

export default router;
