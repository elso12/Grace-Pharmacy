import { Request, Response } from 'express';
import Expense from '../models/Expense.model';
import Sale from '../models/Sale.model';
import Order from '../models/Order.model';
import InventoryBatch from '../models/InventoryBatch.model';
import { SaleStatus, OrderPaymentStatus } from '../types/enums';

/**
 * Generate a formal P&L statement
 */
export const getPnLStatement = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'startDate and endDate are required' });
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    // 1. Gross Sales Revenue & COGS
    const sales = await Sale.find({
      createdAt: { $gte: start, $lte: end },
      status: SaleStatus.COMPLETED
    });

    const orders = await Order.find({
      createdAt: { $gte: start, $lte: end },
      paymentStatus: OrderPaymentStatus.PAID
    });

    let grossSales = 0;
    let cogs = 0;

    // Calculate from Sales
    for (const sale of sales) {
      grossSales += sale.totalAmount;
      // Calculate COGS: We need the purchase price of the batches dispensed
      for (const item of sale.items) {
        // If the sale item has a batchId, look it up
        if ((item as any).batchId) {
          const batch = await InventoryBatch.findById((item as any).batchId);
          if (batch) {
            cogs += (batch.purchasePrice || 0) * item.quantity;
          }
        }
      }
    }

    // Calculate from Orders
    for (const order of orders) {
      grossSales += order.totalAmount;
      for (const item of order.items) {
        if ((item as any).batchId) {
          const batch = await InventoryBatch.findById((item as any).batchId);
          if (batch) {
            cogs += (batch.purchasePrice || 0) * item.quantity;
          }
        }
      }
    }

    const grossProfit = grossSales - cogs;

    // 2. Operating Expenses (OPEX)
    const expenses = await Expense.find({
      date: { $gte: start, $lte: end }
    });

    const opex = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    // 3. Net Profit (EBIT)
    const netProfit = grossProfit - opex;
    
    // 4. Net Profit Margin
    const netProfitMargin = grossSales > 0 ? (netProfit / grossSales) * 100 : 0;
    const grossProfitMargin = grossSales > 0 ? (grossProfit / grossSales) * 100 : 0;

    return res.status(200).json({
      success: true,
      data: {
        period: { start, end },
        grossSales,
        cogs,
        grossProfit,
        grossProfitMargin,
        opex,
        expenses,
        netProfit,
        netProfitMargin
      }
    });

  } catch (error: any) {
    console.error('Error generating P&L:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate P&L statement' });
  }
};

/**
 * Log a new operating expense
 */
export const logExpense = async (req: Request, res: Response) => {
  try {
    const { title, category, amount, date } = req.body;
    const recordedBy = req.user?._id;

    if (!title || !category || !amount || !date) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const expense = new Expense({
      title,
      category,
      amount,
      date: new Date(date),
      recordedBy
    });

    await expense.save();

    return res.status(201).json({ success: true, message: 'Expense logged successfully', data: expense });
  } catch (error: any) {
    console.error('Error logging expense:', error);
    return res.status(500).json({ success: false, message: 'Failed to log expense' });
  }
};
