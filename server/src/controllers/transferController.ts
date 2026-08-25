import { Request, Response } from 'express';
import StockTransfer, { TransferStatus } from '../models/StockTransfer.model';
import InventoryBatch from '../models/InventoryBatch.model';
import { BatchStatus } from '../types/enums';

export const getTransfers = async (req: Request, res: Response) => {
  try {
    const transfers = await StockTransfer.find()
      .populate('fromBranchId', 'name code')
      .populate('toBranchId', 'name code')
      .populate('requestedBy', 'firstName lastName')
      .populate('approvedBy', 'firstName lastName')
      .populate('receivedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: transfers });
  } catch (error: any) {
    console.error('Error fetching transfers:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch transfers' });
  }
};

export const requestTransfer = async (req: Request, res: Response) => {
  try {
    const { fromBranchId, toBranchId, items, notes } = req.body;
    const userId = (req as any).user._id;

    // Generate unique transfer number
    const count = await StockTransfer.countDocuments();
    const transferNumber = `TRF-2026-${(count + 1).toString().padStart(3, '0')}`;

    const transfer = await StockTransfer.create({
      transferNumber,
      fromBranchId,
      toBranchId,
      requestedBy: userId,
      items,
      notes,
      status: TransferStatus.REQUESTED,
    });

    res.status(201).json({ success: true, data: transfer });
  } catch (error: any) {
    console.error('Error requesting transfer:', error);
    res.status(500).json({ success: false, message: 'Failed to create transfer request' });
  }
};

export const dispatchTransfer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user._id;

    const transfer = await StockTransfer.findById(id);
    if (!transfer) {
      return res.status(404).json({ success: false, message: 'Transfer not found' });
    }

    if (transfer.status !== TransferStatus.REQUESTED && transfer.status !== TransferStatus.APPROVED) {
      return res.status(400).json({ success: false, message: 'Transfer is not in a valid state to be dispatched' });
    }

    // Deduct stock from the source branch
    // Note: Since our InventoryBatch model doesn't currently filter strictly by branchId for FEFO,
    // we assume the logic would normally pick batches specific to `fromBranchId`.
    // For this demonstration, we'll just deduct from active batches for the product.
    for (const item of transfer.items) {
      // Find active batches for the product
      const batches = await InventoryBatch.find({
        product: item.productId,
        status: BatchStatus.ACTIVE,
        quantity: { $gt: 0 }
      }).sort({ expiryDate: 1 }); // FEFO
      
      let remainingQuantityToTransfer = item.quantity;

      for (const batch of batches) {
        if (remainingQuantityToTransfer <= 0) break;

        const quantityAvailable = batch.quantity;
        if (quantityAvailable >= remainingQuantityToTransfer) {
          batch.quantity -= remainingQuantityToTransfer;
          await batch.save();
          // We can record which batch was used
          item.batchNumber = batch.batchNumber;
          remainingQuantityToTransfer = 0;
        } else {
          remainingQuantityToTransfer -= quantityAvailable;
          batch.quantity = 0;
          batch.status = BatchStatus.DEPLETED;
          await batch.save();
        }
      }
      
      if (remainingQuantityToTransfer > 0) {
         return res.status(400).json({ success: false, message: `Insufficient stock for product ${item.productName}` });
      }
    }

    transfer.status = TransferStatus.IN_TRANSIT;
    transfer.approvedBy = userId;
    transfer.dispatchedAt = new Date();
    await transfer.save();

    res.status(200).json({ success: true, data: transfer });
  } catch (error: any) {
    console.error('Error dispatching transfer:', error);
    res.status(500).json({ success: false, message: 'Failed to dispatch transfer' });
  }
};

export const receiveTransfer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user._id;

    const transfer = await StockTransfer.findById(id);
    if (!transfer) {
      return res.status(404).json({ success: false, message: 'Transfer not found' });
    }

    if (transfer.status !== TransferStatus.IN_TRANSIT) {
      return res.status(400).json({ success: false, message: 'Transfer is not in transit' });
    }

    // Ingest into the destination branch
    // We will create new InventoryBatch records for the destination branch
    // In our simplified system, we might just add to a global pool, but we will create new records.
    for (const item of transfer.items) {
      await InventoryBatch.create({
        product: item.productId,
        batchNumber: `${item.batchNumber}-TRF`,
        quantity: item.quantity,
        costPrice: 0, // We would normally look this up, 0 for mock
        expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // Default 180 days for mock
        shelfLocation: 'Transfer Receiving Dock',
        status: BatchStatus.ACTIVE,
      });
    }

    transfer.status = TransferStatus.RECEIVED;
    transfer.receivedBy = userId;
    transfer.receivedAt = new Date();
    await transfer.save();

    res.status(200).json({ success: true, data: transfer });
  } catch (error: any) {
    console.error('Error receiving transfer:', error);
    res.status(500).json({ success: false, message: 'Failed to receive transfer' });
  }
};
