import cron from 'node-cron';
import Product from '../models/Product.model';
import InventoryBatch from '../models/InventoryBatch.model';
import Alert, { AlertType, AlertPriority, AlertStatus } from '../models/Alert.model';
import { BatchStatus } from '../types/enums';

/**
 * Scans InventoryBatches for items expiring in less than 30 days.
 */
const scanExpiringBatches = async () => {
  try {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringBatches = await InventoryBatch.find({
      status: BatchStatus.ACTIVE,
      expiryDate: { $lte: thirtyDaysFromNow },
    }).populate('product');

    for (const batch of expiringBatches) {
      const existingAlert = await Alert.findOne({
        type: AlertType.EXPIRING_BATCH,
        referenceId: batch._id,
        status: AlertStatus.UNRESOLVED,
      });

      if (!existingAlert) {
        const product = batch.product as any;
        const daysUntilExpiry = Math.ceil((new Date(batch.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        const isExpired = daysUntilExpiry <= 0;

        await Alert.create({
          type: AlertType.EXPIRING_BATCH,
          message: isExpired
            ? `Batch ${batch.batchNumber} of ${product?.name} has expired!`
            : `Batch ${batch.batchNumber} of ${product?.name} is expiring in ${daysUntilExpiry} days.`,
          priority: isExpired ? AlertPriority.CRITICAL : AlertPriority.HIGH,
          referenceId: batch._id,
        });
      }
    }
  } catch (error) {
    console.error('Error scanning expiring batches:', error);
  }
};

/**
 * Scans Products to see if total active stock is below reorderLevel.
 */
const scanLowStock = async () => {
  try {
    const products = await Product.find({ isActive: true });

    for (const product of products) {
      const activeBatches = await InventoryBatch.find({
        product: product._id,
        status: BatchStatus.ACTIVE,
      });

      const totalQuantity = activeBatches.reduce((sum, b) => sum + b.quantity, 0);

      if (totalQuantity <= product.reorderLevel) {
        const existingAlert = await Alert.findOne({
          type: AlertType.LOW_STOCK,
          referenceId: product._id,
          status: AlertStatus.UNRESOLVED,
        });

        if (!existingAlert) {
          await Alert.create({
            type: AlertType.LOW_STOCK,
            message: `Low stock for ${product.name} (SKU: ${product.sku}). Current stock: ${totalQuantity}, Reorder Level: ${product.reorderLevel}`,
            priority: totalQuantity === 0 ? AlertPriority.CRITICAL : AlertPriority.MEDIUM,
            referenceId: product._id,
          });
        } else if (existingAlert.priority !== AlertPriority.CRITICAL && totalQuantity === 0) {
          // Escalate if it hit 0
          existingAlert.priority = AlertPriority.CRITICAL;
          existingAlert.message = `Out of stock for ${product.name} (SKU: ${product.sku}).`;
          await existingAlert.save();
        }
      }
    }
  } catch (error) {
    console.error('Error scanning low stock:', error);
  }
};

export const startCronJobs = () => {
  // Run daily at midnight
  cron.schedule('0 0 * * *', async () => {
    console.log('[Cron] Starting daily inventory scan...');
    await scanExpiringBatches();
    await scanLowStock();
    console.log('[Cron] Inventory scan completed.');
  });
};
