/**
 * ─── Inventory Controller ─────────────────────────────────────────────────
 * Thin HTTP layer — validates input (via Zod middleware), delegates to
 * the service layer, and shapes the JSON response.
 *
 * All handlers use asyncHandler to forward errors to the global handler.
 */

import { type Request, type Response } from "express";
import { asyncHandler, AppError } from "../utils/errors";
import * as inventoryService from "../services/inventory.service";
import InventoryBatch from "../models/InventoryBatch.model";
import { BatchStatus } from "../types/enums";
import type {
  AddBatchInput,
  FefoDispenseInput,
  ExpiryAlertInput,
  LowStockAlertInput,
} from "../validators/inventory.validators";

// ═════════════════════════════════════════════════════════════════════════════
// POST /api/inventory/batches
// ═════════════════════════════════════════════════════════════════════════════
/**
 * @desc    Add a new inventory batch for a product
 * @route   POST /api/inventory/batches
 * @access  Private (ADMIN, PHARMACIST, TECHNICIAN)
 */
export const addBatch = asyncHandler(async (req: Request, res: Response) => {
  // Body already validated & typed by Zod middleware
  const data = req.body as AddBatchInput;

  const batch = await inventoryService.addBatch(data);

  res.status(201).json({
    status: "success",
    message: "Inventory batch added successfully",
    data: { batch },
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// GET /api/inventory/fefo-dispense?productId=X&quantity=Y
// ═════════════════════════════════════════════════════════════════════════════
/**
 * @desc    Calculate FEFO-based dispense plan for a product.
 *          Returns which batches to deduct from and in what quantities.
 *          Pass ?commit=true to actually deduct the stock (transactional).
 * @route   GET /api/inventory/fefo-dispense
 * @access  Private (PHARMACIST, TECHNICIAN, CASHIER)
 */
export const fefoDispense = asyncHandler(
  async (req: Request, res: Response) => {
    // Query already validated & coerced by Zod middleware
    const { productId, quantity } = req.query as unknown as FefoDispenseInput;
    const commit = req.query.commit === "true";

    const result = await inventoryService.calculateFefoDispense(
      { productId, quantity },
      commit
    );

    // Use 200 for dry run, 200 for committed, 422 if insufficient
    const statusCode = result.canFulfill ? 200 : 422;

    res.status(statusCode).json({
      status: result.canFulfill ? "success" : "error",
      message: result.canFulfill
        ? commit
          ? `Dispensed ${quantity} unit(s) of ${result.productName} using FEFO`
          : `FEFO dispense plan ready for ${quantity} unit(s) of ${result.productName}`
        : `Insufficient stock. Requested ${quantity}, available ${result.totalAvailable}`,
      data: result,
    });
  }
);

// ═════════════════════════════════════════════════════════════════════════════
// GET /api/inventory/alerts/expiry?days=30
// ═════════════════════════════════════════════════════════════════════════════
/**
 * @desc    Get batches expiring within N days + already-expired batches.
 *          Results include urgency classification (EXPIRED/CRITICAL/WARNING/INFO).
 * @route   GET /api/inventory/alerts/expiry
 * @access  Private (ALL ROLES)
 */
export const expiryAlerts = asyncHandler(
  async (req: Request, res: Response) => {
    const input = req.query as unknown as ExpiryAlertInput;

    const alerts = await inventoryService.getExpiryAlerts(input);

    res.status(200).json({
      status: "success",
      message: `Found ${alerts.summary.totalAlerts} batch(es) requiring attention`,
      data: alerts,
    });
  }
);

// ═════════════════════════════════════════════════════════════════════════════
// GET /api/inventory/alerts/low-stock?threshold=10
// ═════════════════════════════════════════════════════════════════════════════
/**
 * @desc    Get products below their reorder threshold.
 *          Includes products with zero stock (no active batches).
 *          Optionally override threshold for all products.
 * @route   GET /api/inventory/alerts/low-stock
 * @access  Private (ALL ROLES)
 */
export const lowStockAlerts = asyncHandler(
  async (req: Request, res: Response) => {
    const input = req.query as unknown as LowStockAlertInput;

    const alerts = await inventoryService.getLowStockAlerts(input);

    res.status(200).json({
      status: "success",
      message: `Found ${alerts.summary.totalProducts} product(s) below reorder level`,
      data: alerts,
    });
  }
);

// ═════════════════════════════════════════════════════════════════════════════
// PATCH /api/inventory/batches/:id/quarantine
// ═════════════════════════════════════════════════════════════════════════════
/**
 * @desc    Quarantine a batch (mark as QUARANTINED).
 * @route   PATCH /api/inventory/batches/:id/quarantine
 * @access  Private (ADMIN, PHARMACIST)
 */
export const quarantineBatch = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const batch = await InventoryBatch.findById(id);
  if (!batch) {
    throw new AppError("Batch not found", 404);
  }

  if (batch.status === BatchStatus.QUARANTINED) {
    throw new AppError("Batch is already quarantined", 400);
  }

  batch.status = BatchStatus.QUARANTINED;
  await batch.save();

  res.status(200).json({
    status: "success",
    message: "Batch successfully quarantined",
    data: { batch },
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// POST /api/inventory/count
// ═════════════════════════════════════════════════════════════════════════════
import { CycleCount } from '../models/CycleCount.model';

export const submitCycleCount = asyncHandler(async (req: Request, res: Response) => {
  const { batchId, expectedQuantity, actualQuantity, notes } = req.body;
  
  if (!batchId || expectedQuantity === undefined || actualQuantity === undefined) {
    throw new AppError("batchId, expectedQuantity, and actualQuantity are required", 400);
  }

  const batch = await InventoryBatch.findById(batchId);
  if (!batch) {
    throw new AppError("Batch not found", 404);
  }

  const cycleCount = await CycleCount.create({
    tenantId: batch.tenantId,
    batchId,
    expectedQuantity,
    actualQuantity,
    countedBy: req.user?._id,
    notes,
  });

  res.status(201).json({
    status: "success",
    message: "Cycle count submitted for review",
    data: { cycleCount },
  });
});

export const getBatches = asyncHandler(async (req: Request, res: Response) => {
  const batches = await InventoryBatch.find().populate('product', 'name category unitPrice').sort({ expiryDate: 1 });
  res.status(200).json({
    success: true,
    data: batches,
  });
});
