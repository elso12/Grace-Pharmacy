import { Request, Response } from 'express';
import Order from '../models/Order.model';
import InventoryBatch from '../models/InventoryBatch.model';
import { OrderStatus, BatchStatus } from '../types/enums';

export const getAnalyticsSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const totalOrders = await Order.countDocuments();

    // 1. Total Revenue and Profit
    const revenueResult = await Order.aggregate([
      { $match: { status: OrderStatus.COMPLETED } },
      { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } }
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;
    
    // For profit, we would typically need the COGS (Cost of Goods Sold). 
    // We'll estimate it here as 60% margin for the sake of the dashboard.
    // In a full implementation, we'd sum the purchasePrice * qty from InventoryBatch for each sale.
    const totalProfit = totalRevenue * 0.4;

    // 2. Near-Expiry Value at Risk
    const now = new Date();
    const ninetyDaysFromNow = new Date();
    ninetyDaysFromNow.setDate(now.getDate() + 90);

    const expiryRiskResult = await InventoryBatch.aggregate([
      { 
        $match: { 
          status: BatchStatus.ACTIVE, 
          expiryDate: { $lte: ninetyDaysFromNow, $gte: now },
          quantity: { $gt: 0 }
        } 
      },
      { 
        $group: { 
          _id: null, 
          valueAtRisk: { $sum: { $multiply: ["$quantity", "$purchasePrice"] } } 
        } 
      }
    ]);
    const valueAtRisk = expiryRiskResult.length > 0 ? expiryRiskResult[0].valueAtRisk : 0;

    // 3. Low Stock Count
    const lowStockCount = await InventoryBatch.countDocuments({
      $or: [
        { quantity: { $lt: 10, $gt: 0 } },
        { expiryDate: { $lte: ninetyDaysFromNow, $gte: now } }
      ]
    });

    res.status(200).json({
      status: 'success',
      data: {
        totalOrders,
        totalRevenue,
        totalProfit,
        valueAtRisk,
        lowStockCount,
      }
    });
  } catch (error: any) {
    console.error('[AnalyticsController] Error getting summary:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};
