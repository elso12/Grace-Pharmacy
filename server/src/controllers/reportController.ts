import { Request, Response, NextFunction } from 'express';
import { Parser } from 'json2csv';
import PDFDocument from 'pdfkit';
import Sale from '../models/Sale.model';
import InventoryBatch from '../models/InventoryBatch.model';

export const exportSalesCsv = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const sales = await Sale.find().populate('customer').populate('dispensedBy').sort({ createdAt: -1 });

    const fields = ['invoiceNumber', 'totalAmount', 'paymentMethod', 'status', 'createdAt'];
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(sales);

    res.header('Content-Type', 'text/csv');
    res.attachment('sales-report.csv');
    res.send(csv);
  } catch (error) {
    next(error);
  }
};

export const exportInventoryPdf = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const batches = await InventoryBatch.find().populate('product').sort({ expiryDate: 1 });

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=inventory-report.pdf');

    doc.pipe(res);

    doc.fontSize(20).text('Inventory Report (FEFO Ordered)', { align: 'center' });
    doc.moveDown();

    batches.forEach(batch => {
      const product = batch.product as any;
      doc.fontSize(12).text(`Batch: ${batch.batchNumber}`);
      doc.fontSize(10).text(`Product: ${product?.name} (SKU: ${product?.sku})`);
      doc.fontSize(10).text(`Quantity: ${batch.quantity}`);
      doc.fontSize(10).text(`Expiry Date: ${new Date(batch.expiryDate).toLocaleDateString()}`);
      doc.fontSize(10).text(`Status: ${batch.status}`);
      doc.moveDown();
    });

    doc.end();
  } catch (error) {
    next(error);
  }
};
