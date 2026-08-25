import { Request, Response } from 'express';
import Sale from '../models/Sale.model';
import Product from '../models/Product.model';
import { Types } from 'mongoose';

/**
 * Generate a tax report for a given date range
 * Groups sales into taxable (usually OTC) vs non-taxable (usually Rx)
 */
export const getTaxReport = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'startDate and endDate are required' });
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    // Sales within date range
    const sales = await Sale.find({
      createdAt: { $gte: start, $lte: end },
      status: 'COMPLETED'
    }).populate('items.product');

    let grossRevenue = 0;
    let taxableSales = 0;
    let nonTaxableSales = 0;
    let totalTaxCollected = 0;

    sales.forEach(sale => {
      grossRevenue += sale.totalAmount;
      totalTaxCollected += sale.taxAmount || 0;
      
      sale.items.forEach(item => {
        // Simple heuristic: if it requires prescription, it's non-taxable. Otherwise taxable.
        // Or if it's already defined on the product/sale item
        const product = item.product as any;
        const lineTotal = item.quantity * item.unitPrice;
        
        if (product && product.requiresPrescription) {
          nonTaxableSales += lineTotal;
        } else {
          taxableSales += lineTotal;
        }
      });
    });

    return res.status(200).json({
      success: true,
      data: {
        period: { start, end },
        grossRevenue,
        taxableSales,
        nonTaxableSales,
        totalTaxCollected
      }
    });

  } catch (error) {
    console.error('Error generating tax report:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate tax report' });
  }
};

/**
 * Audit log of all controlled substance movements
 */
export const getControlledSubstancesAudit = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'startDate and endDate are required' });
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    // Find all controlled substances
    const controlledProducts = await Product.find({ category: 'CONTROLLED' }).select('_id name sku');
    const controlledIds = controlledProducts.map(p => p._id);

    // Find sales of controlled substances
    const sales = await Sale.find({
      createdAt: { $gte: start, $lte: end },
      status: 'COMPLETED',
      'items.product': { $in: controlledIds }
    }).populate('items.product', 'name sku category')
      .populate('dispensedBy', 'firstName lastName')
      .populate('items.prescription');

    const auditLog = sales.flatMap(sale => {
      // Filter items to only include controlled substances
      const controlledItems = sale.items.filter(item => 
        controlledIds.some(id => id.equals(item.product._id))
      );

      return controlledItems.map(item => ({
        transactionId: sale._id,
        orderNumber: sale.invoiceNumber,
        date: sale.createdAt,
        product: item.product,
        quantityDispensed: item.quantity,
        dispensedBy: sale.dispensedBy,
        prescription: item.prescription || null,
        patientName: (sale as any).customerName || 'Walk-in'
      }));
    });

    return res.status(200).json({
      success: true,
      data: {
        period: { start, end },
        auditLog
      }
    });

  } catch (error) {
    console.error('Error generating controlled substances audit:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate controlled substances audit' });
  }
};
