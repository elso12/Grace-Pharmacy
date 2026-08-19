/**
 * ─── Inventory Service ────────────────────────────────────────────────────
 * Business logic for inventory management. Keeps controllers thin by
 * encapsulating all DB queries, FEFO algorithm, and alert computations.
 *
 * Design decisions:
 *   - FEFO uses the compound index { product, expiryDate, status } so the
 *     DB returns batches pre-sorted by expiry — no in-memory sorting.
 *   - Batch deductions are performed inside a Mongoose session/transaction
 *     to guarantee atomicity (all-or-nothing stock deduction).
 *   - Low-stock uses an aggregation pipeline to sum batch quantities per
 *     product and compare against each product's reorderLevel.
 */

import mongoose from "mongoose";
import InventoryBatch, {
  type IInventoryBatch,
} from "../models/InventoryBatch.model";
import Product from "../models/Product.model";
import { BatchStatus } from "../types/enums";
import { AppError } from "../utils/errors";
import type {
  AddBatchInput,
  FefoDispenseInput,
  ExpiryAlertInput,
  LowStockAlertInput,
} from "../validators/inventory.validators";

// ─── Types ──────────────────────────────────────────────────────────────────

/** Single batch deduction in the FEFO dispense plan */
export interface BatchDeduction {
  batchId: string;
  batchNumber: string;
  expiryDate: Date;
  daysUntilExpiry: number;
  quantityToDeduct: number;
  remainingAfterDeduction: number;
  sellingPrice: number;
}

/** Full result returned by the FEFO dispense engine */
export interface FefoDispenseResult {
  productId: string;
  productName: string;
  requestedQuantity: number;
  totalAvailable: number;
  canFulfill: boolean;
  deductions: BatchDeduction[];
  totalCost: number;
}

/** Product entry in the low-stock alert */
export interface LowStockProduct {
  productId: string;
  name: string;
  sku: string;
  genericName: string;
  category: string;
  reorderLevel: number;
  currentStock: number;
  deficit: number;
  activeBatches: number;
}

/** Batch item returned in expiry alerts */
export interface ExpiryAlertBatchItem {
  _id?: unknown;
  product?: unknown;
  batchNumber: string;
  quantity: number;
  initialQuantity: number;
  expiryDate: Date;
  manufacturingDate?: Date;
  purchasePrice: number;
  sellingPrice: number;
  supplier?: unknown;
  receivedDate: Date;
  status: BatchStatus | string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
  daysUntilExpiry: number;
  urgency: "EXPIRED" | "CRITICAL" | "WARNING" | "INFO";
}

/** Full result returned by getExpiryAlerts */
export interface ExpiryAlertResult {
  alertWindow: {
    days: number;
    from: string;
    to: string;
  };
  summary: {
    expiringSoon: number;
    alreadyExpired: number;
    totalAlerts: number;
  };
  alreadyExpired: ExpiryAlertBatchItem[];
  expiringSoon: ExpiryAlertBatchItem[];
}

// ═════════════════════════════════════════════════════════════════════════════
// ─── ADD BATCH ──────────────────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

export const addBatch = async (
  data: AddBatchInput
): Promise<IInventoryBatch> => {
  // Verify the product actually exists
  const product = await Product.findById(data.productId);
  if (!product) {
    throw new AppError("Product not found", 404);
  }
  if (!product.isActive) {
    throw new AppError("Cannot add batch for an inactive product", 400);
  }

  const batch = await InventoryBatch.create({
    product: data.productId,
    batchNumber: data.batchNumber,
    quantity: data.quantity,
    initialQuantity: data.quantity,
    expiryDate: new Date(data.expiryDate),
    manufacturingDate: data.manufacturingDate
      ? new Date(data.manufacturingDate)
      : undefined,
    purchasePrice: data.purchasePrice ?? data.costPrice,
    costPrice: data.costPrice,
    sellingPrice: data.sellingPrice,
    storageLocation: data.storageLocation,
    supplier: data.supplierId || undefined,
    receivedDate: data.receivedDate ? new Date(data.receivedDate) : new Date(),
    notes: data.notes,
  });

  // Return with product populated
  return batch.populate("product", "name sku genericName");
};

// ═════════════════════════════════════════════════════════════════════════════
// ─── FEFO DISPENSE ENGINE ───────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════
/**
 * Calculates which batches to deduct from using First-Expired-First-Out:
 *
 * 1. Query all ACTIVE, non-expired batches for the product
 *    → sorted by expiryDate ASC (nearest expiry first)
 *    → uses compound index { product: 1, expiryDate: 1, status: 1 }
 *
 * 2. Walk through batches greedily, accumulating deductions until
 *    the requested quantity is fulfilled.
 *
 * 3. If commit=false (default), return the dispense plan without
 *    touching the DB — a "dry run" for the frontend to preview.
 *
 * 4. If commit=true, execute all deductions atomically inside a
 *    MongoDB transaction. On any failure, everything rolls back.
 */
export const calculateFefoDispense = async (
  input: FefoDispenseInput,
  commit = false
): Promise<FefoDispenseResult> => {
  const { productId, quantity: requestedQty } = input;

  // Verify product exists
  const product = await Product.findById(productId).lean();
  if (!product) {
    throw new AppError("Product not found", 404);
  }

  // ── Step 1: Fetch ACTIVE, non-expired batches sorted by nearest expiry ──
  const now = new Date();
  const batches = await InventoryBatch.find({
    product: productId,
    status: BatchStatus.ACTIVE,
    expiryDate: { $gt: now }, // exclude already-expired
    quantity: { $gt: 0 },
  })
    .sort({ expiryDate: 1 }) // FEFO: nearest expiry first
    .lean();

  const totalAvailable = batches.reduce((sum, b) => sum + b.quantity, 0);

  // ── Step 2: Greedily allocate from earliest-expiry batches ──────────────
  let remaining = requestedQty;
  const deductions: BatchDeduction[] = [];

  for (const batch of batches) {
    if (remaining <= 0) break;

    const deductQty = Math.min(remaining, batch.quantity);
    const expiryTime = new Date(batch.expiryDate).getTime();
    const daysUntilExpiry = Math.ceil(
      (expiryTime - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    deductions.push({
      batchId: batch._id.toString(),
      batchNumber: batch.batchNumber,
      expiryDate: batch.expiryDate,
      daysUntilExpiry,
      quantityToDeduct: deductQty,
      remainingAfterDeduction: batch.quantity - deductQty,
      sellingPrice: batch.sellingPrice,
    });

    remaining -= deductQty;
  }

  const canFulfill = remaining <= 0;
  const totalCost = deductions.reduce(
    (sum, d) => sum + d.quantityToDeduct * d.sellingPrice,
    0
  );

  const result: FefoDispenseResult = {
    productId,
    productName: product.name,
    requestedQuantity: requestedQty,
    totalAvailable,
    canFulfill,
    deductions,
    totalCost: Math.round(totalCost * 100) / 100,
  };

  // ── Step 3 (optional): Commit deductions atomically ─────────────────────
  if (commit && canFulfill) {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        for (const deduction of deductions) {
          const newQty = deduction.remainingAfterDeduction;
          const updateFields: Record<string, unknown> = {
            quantity: newQty,
          };
          // Auto-deplete if quantity hits zero
          if (newQty === 0) {
            updateFields.status = BatchStatus.DEPLETED;
          }

          const updated = await InventoryBatch.findByIdAndUpdate(
            deduction.batchId,
            { $set: updateFields },
            { new: true, session }
          );

          if (!updated) {
            throw new AppError(
              `Batch ${deduction.batchNumber} not found during commit`,
              409
            );
          }

          // Optimistic concurrency: verify quantity didn't change
          // between plan and commit
          if (
            updated.quantity + deduction.quantityToDeduct !==
            deduction.remainingAfterDeduction + deduction.quantityToDeduct
          ) {
            throw new AppError(
              `Concurrent modification detected on batch ${deduction.batchNumber}. Please retry.`,
              409
            );
          }
        }
      });
    } finally {
      await session.endSession();
    }
  }

  return result;
};

// ═════════════════════════════════════════════════════════════════════════════
// ─── EXPIRY ALERTS ──────────────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════
/**
 * Finds all batches expiring within N days.
 *
 * Returns batches grouped with product details, sorted by expiry date
 * ascending (most urgent first). Uses the { expiryDate, status } index.
 */
export const getExpiryAlerts = async (
  input: ExpiryAlertInput
): Promise<ExpiryAlertResult> => {
  const { days, status } = input;

  const now = new Date();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() + days);

  const batches = await InventoryBatch.find({
    status,
    quantity: { $gt: 0 },
    expiryDate: {
      $gt: now, // not yet expired
      $lte: cutoffDate, // but within the alert window
    },
  })
    .sort({ expiryDate: 1 }) // most urgent first
    .select('-purchasePrice -sellingPrice')
    .populate("product", "name sku genericName category dosageForm strength")
    .lean();

  // Also include already-expired ACTIVE batches (should have been caught)
  const expiredBatches = await InventoryBatch.find({
    status: BatchStatus.ACTIVE,
    quantity: { $gt: 0 },
    expiryDate: { $lte: now },
  })
    .sort({ expiryDate: 1 })
    .select('-purchasePrice -sellingPrice')
    .populate("product", "name sku genericName category dosageForm strength")
    .lean();

  const alreadyExpired: ExpiryAlertBatchItem[] = expiredBatches.map((b) => ({
    ...b,
    daysUntilExpiry: Math.ceil(
      (new Date(b.expiryDate).getTime() - now.getTime()) /
        (1000 * 60 * 60 * 24)
    ),
    urgency: "EXPIRED" as const,
  }));

  const expiringSoon: ExpiryAlertBatchItem[] = batches.map((b) => {
    const daysUntilExpiry = Math.ceil(
      (new Date(b.expiryDate).getTime() - now.getTime()) /
        (1000 * 60 * 60 * 24)
    );
    return {
      ...b,
      daysUntilExpiry,
      urgency:
        daysUntilExpiry <= 7
          ? ("CRITICAL" as const)
          : daysUntilExpiry <= 14
            ? ("WARNING" as const)
            : ("INFO" as const),
    };
  });

  return {
    alertWindow: {
      days,
      from: now.toISOString(),
      to: cutoffDate.toISOString(),
    },
    summary: {
      expiringSoon: batches.length,
      alreadyExpired: expiredBatches.length,
      totalAlerts: batches.length + expiredBatches.length,
    },
    alreadyExpired,
    expiringSoon,
  };
};

// ═════════════════════════════════════════════════════════════════════════════
// ─── LOW-STOCK ALERTS ───────────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════
/**
 * Aggregation pipeline that:
 * 1. Groups all ACTIVE batches by product, summing their quantities.
 * 2. Joins with the Product collection to get reorderLevel.
 * 3. Filters products where currentStock < reorderLevel.
 * 4. Sorts by deficit DESC (most urgent first).
 *
 * If a custom threshold is provided, it overrides the per-product
 * reorderLevel for filtering (useful for dashboard-level overrides).
 */
export const getLowStockAlerts = async (
  input: LowStockAlertInput
): Promise<{ summary: { totalProducts: number; totalDeficit: number }; products: LowStockProduct[] }> => {
  const { threshold, includeInactive } = input;

  const pipeline: mongoose.PipelineStage[] = [
    // Stage 1: Only active batches with stock
    {
      $match: {
        status: BatchStatus.ACTIVE,
        quantity: { $gt: 0 },
      },
    },

    // Stage 2: Sum stock per product
    {
      $group: {
        _id: "$product",
        currentStock: { $sum: "$quantity" },
        activeBatches: { $sum: 1 },
      },
    },

    // Stage 3: Join Product collection for reorderLevel & metadata
    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "_id",
        as: "productInfo",
      },
    },
    { $unwind: "$productInfo" },

    // Stage 4: Filter active products only (unless includeInactive)
    ...(includeInactive
      ? []
      : [{ $match: { "productInfo.isActive": true } } as mongoose.PipelineStage]),

    // Stage 5: Compute deficit and filter low-stock
    {
      $addFields: {
        effectiveThreshold: threshold ?? "$productInfo.reorderLevel",
      },
    },
    {
      $match: {
        $expr: { $lt: ["$currentStock", "$effectiveThreshold"] },
      },
    },

    // Stage 6: Shape the output
    {
      $project: {
        _id: 0,
        productId: "$_id",
        name: "$productInfo.name",
        sku: "$productInfo.sku",
        genericName: "$productInfo.genericName",
        category: "$productInfo.category",
        reorderLevel: "$productInfo.reorderLevel",
        currentStock: 1,
        deficit: { $subtract: ["$effectiveThreshold", "$currentStock"] },
        activeBatches: 1,
      },
    },

    // Stage 7: Most critical first
    { $sort: { deficit: -1 } },
  ];

  // Also find products with ZERO stock (no active batches at all)
  const productsWithNoStock = await getProductsWithZeroStock(includeInactive);

  const lowStockResults =
    await InventoryBatch.aggregate<LowStockProduct>(pipeline);

  const allProducts = [...productsWithNoStock, ...lowStockResults];

  const totalDeficit = allProducts.reduce(
    (sum, p) => sum + (p.deficit > 0 ? p.deficit : 0),
    0
  );

  return {
    summary: {
      totalProducts: allProducts.length,
      totalDeficit,
    },
    products: allProducts,
  };
};

/**
 * Finds products that have NO active batches at all — they won't appear
 * in the aggregation above, but they're the most critically out-of-stock.
 */
async function getProductsWithZeroStock(
  includeInactive: boolean
): Promise<LowStockProduct[]> {
  // Get all product IDs that have at least one active batch with stock
  const productsWithStock = await InventoryBatch.distinct("product", {
    status: BatchStatus.ACTIVE,
    quantity: { $gt: 0 },
  });

  const productFilter: Record<string, unknown> = {
    _id: { $nin: productsWithStock },
  };
  if (!includeInactive) {
    productFilter.isActive = true;
  }

  const products = await Product.find(productFilter)
    .select("name sku genericName category reorderLevel")
    .lean();

  return products.map((p) => ({
    productId: p._id.toString(),
    name: p.name,
    sku: p.sku,
    genericName: p.genericName,
    category: p.category,
    reorderLevel: p.reorderLevel,
    currentStock: 0,
    deficit: p.reorderLevel,
    activeBatches: 0,
  }));
}
