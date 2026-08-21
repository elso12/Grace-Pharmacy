import { Router } from 'express';
import { exportSalesCsv, exportInventoryPdf } from '../controllers/reportController';
import { getFinancialSummary } from '../controllers/analyticsController';

const router = Router();

router.route('/sales/csv')
  .get(exportSalesCsv);

router.get('/sales', getFinancialSummary);

router.route('/inventory/pdf')
  .get(exportInventoryPdf);

export default router;
