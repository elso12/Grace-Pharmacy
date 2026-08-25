import mongoose from 'mongoose';
import Order from '../models/Order.model';
import InventoryBatch from '../models/InventoryBatch.model';
import Product from '../models/Product.model';
import PurchaseOrder, { POStatus } from '../models/PurchaseOrder.model';
import { OrderStatus, BatchStatus } from '../types/enums';

/**
 * Calculates the 30-day run rate for products and generates POs for those below threshold.
 */
export const checkVelocityAndGeneratePOs = async (): Promise<void> => {
  console.log('[VelocityService] Starting 30-day run rate analysis...');
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 1. Calculate 30-day sales velocity per product
    const velocityData = await Order.aggregate([
      { $match: { status: OrderStatus.COMPLETED, createdAt: { $gte: thirtyDaysAgo } } },
      { $unwind: '$items' },
      { $group: { _id: '$items.product', totalSold30Days: { $sum: '$items.quantity' } } }
    ]);

    // 2. Get current active stock per product
    const stockData = await InventoryBatch.aggregate([
      { $match: { status: BatchStatus.ACTIVE, expiryDate: { $gt: new Date() } } },
      { $group: { _id: '$product', currentStock: { $sum: '$quantity' } } }
    ]);

    const stockMap = new Map(stockData.map(s => [s._id.toString(), s.currentStock]));

    const posToGenerate = new Map<string, any[]>(); // supplierId -> items

    // 3. Analyze and group by supplier
    for (const v of velocityData) {
      const productId = v._id.toString();
      const runRate = v.totalSold30Days;
      const currentStock = stockMap.get(productId) || 0;

      // Smart threshold: If we have less than 15 days of stock based on the 30-day run rate
      const dailyRunRate = runRate / 30;
      const daysOfStock = dailyRunRate > 0 ? currentStock / dailyRunRate : 999;

      if (daysOfStock < 15) {
        // Need to reorder. Let's order a 30-day supply.
        const orderQty = Math.ceil(runRate); 
        
        // Find product to get supplier (assuming product has a primary supplier or we use the latest batch's supplier)
        // For simplicity, we'll find the most recent batch's supplier for this product.
        const latestBatch = await InventoryBatch.findOne({ product: productId }).sort({ createdAt: -1 });
        if (latestBatch && latestBatch.supplier) {
          const supplierId = latestBatch.supplier.toString();
          if (!posToGenerate.has(supplierId)) posToGenerate.set(supplierId, []);
          
          const productDoc = await Product.findById(productId);
          
          posToGenerate.get(supplierId)!.push({
            productId: productId,
            productName: productDoc?.name || 'Unknown',
            requestedQuantity: orderQty,
            unitCost: latestBatch.purchasePrice,
            totalCost: orderQty * (latestBatch.purchasePrice || 0)
          });
        }
      }
    }

    // 4. Generate Purchase Orders
    for (const [supplierId, items] of posToGenerate.entries()) {
      const totalAmount = items.reduce((sum, item) => sum + item.totalCost, 0);
      
      const supplierDoc = await mongoose.model('Supplier').findById(supplierId);

      const newPO = new PurchaseOrder({
        supplierId: supplierId,
        supplierName: supplierDoc?.name || 'Unknown Supplier',
        items,
        totalAmount,
        status: POStatus.PENDING_APPROVAL,
        // Since there is no actual user here, we can find a default admin or let it be if optional,
        // but generatedBy is required. We'll find an admin user.
        generatedBy: (await mongoose.model('User').findOne({ role: 'ADMIN' }))?._id || new mongoose.Types.ObjectId()
      });

      await newPO.save();
      console.log(`[VelocityService] Auto-generated PO for supplier ${supplierId} with ${items.length} items.`);
    }

    console.log('[VelocityService] Run rate analysis complete.');
  } catch (error) {
    console.error('[VelocityService] Error during velocity analysis:', error);
  }
};
