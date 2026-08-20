import { Request, Response } from 'express';
import Order from '../models/Order.model';
import Sale from '../models/Sale.model';
import InventoryBatch from '../models/InventoryBatch.model';
import Product from '../models/Product.model';
import { OrderStatus, OrderPaymentStatus, SaleStatus, BatchStatus } from '../types/enums';

export const getAnalyticsSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const totalOrdersCount = await Order.countDocuments();
    const totalSalesCount = await Sale.countDocuments();
    const totalOrders = totalOrdersCount + totalSalesCount;

    // 1. Total Revenue (Completed Sales + Paid Orders)
    const salesRevenueResult = await Sale.aggregate([
      { $match: { status: SaleStatus.COMPLETED } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);
    const ordersRevenueResult = await Order.aggregate([
      { $match: { paymentStatus: OrderPaymentStatus.PAID } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);
    
    const salesRevenue = salesRevenueResult.length > 0 ? salesRevenueResult[0].total : 0;
    const ordersRevenue = ordersRevenueResult.length > 0 ? ordersRevenueResult[0].total : 0;
    const totalRevenue = salesRevenue + ordersRevenue;

    // 2. Low Stock Count
    // We need to count products where their total active stock is <= reorderLevel
    // First, get stock per product
    const stockPerProduct = await InventoryBatch.aggregate([
      { $match: { status: BatchStatus.ACTIVE, quantity: { $gt: 0 } } },
      { $group: { _id: "$product", totalStock: { $sum: "$quantity" } } }
    ]);
    
    const stockMap = new Map();
    stockPerProduct.forEach(item => stockMap.set(item._id.toString(), item.totalStock));
    
    const products = await Product.find({ isActive: true }).select('reorderLevel');
    let lowStockCount = 0;
    
    products.forEach(product => {
      const stock = stockMap.get(product._id.toString()) || 0;
      if (stock <= product.reorderLevel) {
        lowStockCount++;
      }
    });

    // 3. Expiring Batches Count (within next 30 days)
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    const expiringBatchesCount = await InventoryBatch.countDocuments({
      status: BatchStatus.ACTIVE,
      expiryDate: { $lte: thirtyDaysFromNow, $gte: now },
      quantity: { $gt: 0 }
    });

    // 4. Recent Transactions (Merge Sales and Orders)
    const recentSales = await Sale.find().sort({ createdAt: -1 }).limit(5).populate('customer', 'firstName lastName');
    const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(5).populate('customerId', 'firstName lastName');
    
    const combinedTransactions = [
      ...recentSales.map((s: any) => ({
        id: s._id,
        type: 'SALE',
        customerName: s.customer ? `${s.customer.firstName} ${s.customer.lastName}` : 'Walk-in Customer',
        amount: s.totalAmount,
        paymentMethod: s.paymentMethod,
        date: s.createdAt,
        status: s.status
      })),
      ...recentOrders.map((o: any) => ({
        id: o._id,
        type: 'ORDER',
        customerName: o.customerId ? `${o.customerId.firstName} ${o.customerId.lastName}` : 'Online Customer',
        amount: o.totalAmount,
        paymentMethod: o.paymentMethod,
        date: o.createdAt,
        status: o.status
      }))
    ];
    
    combinedTransactions.sort((a, b) => b.date.getTime() - a.date.getTime());
    const recentTransactions = combinedTransactions.slice(0, 5);

    // 5. Sales Trend (Last 7 Days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const dailySales = await Sale.aggregate([
      { $match: { status: SaleStatus.COMPLETED, createdAt: { $gte: sevenDaysAgo } } },
      { $group: { 
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$totalAmount" } 
        } 
      },
      { $sort: { _id: 1 } }
    ]);

    const dailyOrders = await Order.aggregate([
      { $match: { paymentStatus: OrderPaymentStatus.PAID, createdAt: { $gte: sevenDaysAgo } } },
      { $group: { 
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$totalAmount" } 
        } 
      },
      { $sort: { _id: 1 } }
    ]);

    // Map the last 7 days
    const salesTrend = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      
      const sRev = dailySales.find(item => item._id === dateStr)?.revenue || 0;
      const oRev = dailyOrders.find(item => item._id === dateStr)?.revenue || 0;
      
      salesTrend.push({
        date: dateStr,
        revenue: sRev + oRev
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        totalOrders,
        totalRevenue,
        lowStockCount,
        expiringBatchesCount,
        recentTransactions,
        salesTrend
      }
    });
  } catch (error: any) {
    console.error('[AnalyticsController] Error getting summary:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};
