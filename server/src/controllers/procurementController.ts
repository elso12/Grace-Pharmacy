import { Request, Response } from 'express';
import PurchaseOrder, { IPOItem } from '../models/PurchaseOrder.model';
import VendorReturn from '../models/VendorReturn.model';
import Product from '../models/Product.model';
import InventoryBatch from '../models/InventoryBatch.model';
import Supplier from '../models/Supplier.model';
import { Types } from 'mongoose';
import { BatchStatus } from '../types/enums';

/**
 * Automatically group low-stock items by preferred supplier and create draft POs
 */
export const autoGeneratePOs = async (req: Request, res: Response) => {
  try {
    const generatedBy = req.user?._id;

    // Find products where active stock <= minStockThreshold
    const allProducts = await Product.find({ isActive: true });
    
    // Calculate total stock per product
    const stockPerProduct = await InventoryBatch.aggregate([
      { $match: { status: BatchStatus.ACTIVE, quantity: { $gt: 0 } } },
      { $group: { _id: "$product", totalStock: { $sum: "$quantity" } } }
    ]);
    
    const stockMap = new Map();
    stockPerProduct.forEach(item => stockMap.set(item._id.toString(), item.totalStock));
    
    const lowStockProducts = allProducts.filter(p => {
      const stock = stockMap.get(p._id.toString()) || 0;
      return stock <= p.reorderLevel;
    });

    if (lowStockProducts.length === 0) {
      return res.status(200).json({ success: true, message: 'No products are below reorder level.', data: [] });
    }

    // Assign mock suppliers (in a real system, each product would have a preferred supplier)
    // Here we will just fetch one active supplier and group everything under them for demonstration,
    // or group them randomly if no preferred supplier field exists.
    const suppliers = await Supplier.find({ isActive: true });
    if (suppliers.length === 0) {
      return res.status(400).json({ success: false, message: 'No active suppliers found to generate POs.' });
    }
    const defaultSupplier = suppliers[0];

    const poItems: IPOItem[] = lowStockProducts.map(p => {
      const stock = stockMap.get(p._id.toString()) || 0;
      const orderQty = Math.max(p.reorderLevel * 2 - stock, 10); // order up to 2x reorder level or at least 10
      const unitCost = p.unitPrice * 0.6; // mock cost is 60% of unit price
      return {
        productId: p._id as Types.ObjectId,
        productName: p.name,
        requestedQuantity: orderQty,
        unitCost: unitCost,
        totalCost: orderQty * unitCost
      };
    });

    const totalAmount = poItems.reduce((sum, item) => sum + item.totalCost, 0);

    const draftPO = new PurchaseOrder({
      supplierId: defaultSupplier._id,
      supplierName: defaultSupplier.name,
      items: poItems,
      totalAmount,
      status: 'DRAFT',
      generatedBy
    });

    await draftPO.save();

    return res.status(201).json({
      success: true,
      message: 'Generated draft POs for low stock items',
      data: [draftPO]
    });
  } catch (error: any) {
    console.error('Error auto-generating POs:', error);
    return res.status(500).json({ success: false, message: 'Failed to auto-generate POs' });
  }
};

/**
 * Get all Purchase Orders
 */
export const getAllPOs = async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const filter: any = {};
    if (status) filter.status = status;

    const pos = await PurchaseOrder.find(filter)
      .populate('supplierId', 'name email phone')
      .populate('generatedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: pos });
  } catch (error: any) {
    console.error('Error fetching POs:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch POs' });
  }
};

/**
 * Receive Shipment: update PO and inject into FEFO queue
 */
export const receivePOBatch = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { batchNumber, expiryDate, quantityReceived } = req.body;

    if (!batchNumber || !expiryDate || !quantityReceived) {
      return res.status(400).json({ success: false, message: 'Missing required batch fields' });
    }

    const po = await PurchaseOrder.findById(id);
    if (!po) {
      return res.status(404).json({ success: false, message: 'Purchase order not found' });
    }

    // Log the received batch
    po.receivedBatches.push({
      batchNumber,
      expiryDate: new Date(expiryDate),
      quantityReceived: Number(quantityReceived),
      receivedAt: new Date()
    });

    po.status = 'RECEIVED_FULL';
    await po.save();

    // Inject into FEFO queue
    // For simplicity, we'll assign the received quantity to the first item in the PO
    // In a full implementation, the user would specify which product(s) the batch applies to.
    const productItem = po.items[0];
    if (productItem) {
      const newBatch = new InventoryBatch({
        product: productItem.productId,
        batchNumber,
        quantity: Number(quantityReceived),
        initialQuantity: Number(quantityReceived),
        expiryDate: new Date(expiryDate),
        purchasePrice: productItem.unitCost,
        sellingPrice: productItem.unitCost * 1.6, // rough markup
        status: BatchStatus.ACTIVE
      });
      await newBatch.save();
    }

    return res.status(200).json({ success: true, message: 'Shipment received and injected into inventory', data: po });
  } catch (error: any) {
    console.error('Error receiving PO shipment:', error);
    return res.status(500).json({ success: false, message: 'Failed to receive shipment' });
  }
};

/**
 * Create a Vendor Return (RMA)
 */
export const createVendorReturn = async (req: Request, res: Response) => {
  try {
    const { batchId, quantityReturned, reason } = req.body;

    if (!batchId || !quantityReturned || !reason) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const batch = await InventoryBatch.findById(batchId).populate('product');
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }

    if (batch.quantity < quantityReturned) {
      return res.status(400).json({ success: false, message: 'Return quantity exceeds available stock' });
    }

    // Decrement the batch quantity
    batch.quantity -= quantityReturned;
    if (batch.quantity === 0) {
      batch.status = BatchStatus.DEPLETED;
    }
    await batch.save();

    // We need a supplier ID. If the batch doesn't track it natively, we look it up or require it.
    // For now, let's use a dummy or find a default supplier.
    const suppliers = await Supplier.find();
    const defaultSupplier = suppliers[0];

    const rma = new VendorReturn({
      supplierId: defaultSupplier?._id || new Types.ObjectId(),
      batchId,
      quantityReturned,
      reason
    });

    await rma.save();

    return res.status(201).json({ success: true, message: 'Vendor return created', data: rma });
  } catch (error: any) {
    console.error('Error creating vendor return:', error);
    return res.status(500).json({ success: false, message: 'Failed to create vendor return' });
  }
};
