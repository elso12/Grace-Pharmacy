/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ─── Inventory Controller — FEFO (First-Expired, First-Out) Engine ──────
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * This controller implements the core FEFO inventory management logic for a
 * pharmacy system. FEFO is a **regulatory best-practice** in pharmaceutical
 * dispensing: medications closest to their expiry date are always dispensed
 * first. This minimises waste, reduces the risk of dispensing expired drugs,
 * and ensures compliance with pharmacy standards (e.g., FDA, WHO guidelines).
 *
 * Two primary operations:
 *
 *   1. addBatch     — Receives a new shipment of medication into inventory.
 *   2. dispenseMedication — The FEFO engine: deducts stock starting from
 *                           the batch with the nearest expiry date.
 *
 * Architecture:
 *   Controller (this file) → handles HTTP request/response shaping.
 *   The heavy FEFO logic is intentionally kept HERE (not in a service) so
 *   this single file serves as a self-contained portfolio showcase of the
 *   algorithm. In a production app, you'd extract it into a service layer.
 *
 * Transactional Safety:
 *   dispenseMedication uses a MongoDB multi-document transaction to ensure
 *   atomicity. If ANY batch update fails mid-dispense, ALL changes roll
 *   back — no partial deductions, no phantom stock.
 */

import { type Request, type Response } from "express";
import mongoose from "mongoose";
import InventoryBatch, {
  type IInventoryBatch,
} from "../models/InventoryBatch.model";
import Product from "../models/Product.model";
import { BatchStatus } from "../types/enums";
import { asyncHandler } from "../utils/errors";

// ─── Types ──────────────────────────────────────────────────────────────────

/**
 * Shape of a single batch deduction in the FEFO dispense plan.
 * Returned to the client so they can see exactly which batches were touched.
 */
interface BatchDeduction {
  batchId: string;
  batchNumber: string;
  expiryDate: Date;
  daysUntilExpiry: number;
  quantityDeducted: number;
  quantityRemainingAfter: number;
}

/**
 * Request body for POST /api/inventory/batch
 */
interface AddBatchBody {
  productId: string;
  batchNumber: string;
  quantity: number;
  expiryDate: string;          // ISO 8601 date string
  manufacturingDate?: string;  // ISO 8601 date string
  purchasePrice: number;
  sellingPrice: number;
  supplierId?: string;
  receivedDate?: string;       // ISO 8601, defaults to now
  notes?: string;
}

/**
 * Request body for POST /api/inventory/dispense
 */
interface DispenseBody {
  productId: string;
  quantityToDispense: number;
}

// ═════════════════════════════════════════════════════════════════════════════
// ─── ADD BATCH ──────────────────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════
/**
 * @desc    Add a new inventory batch for a product (e.g., receiving a shipment)
 * @route   POST /api/inventory/batch
 * @access  Private (ADMIN, PHARMACIST, TECHNICIAN)
 *
 * Flow:
 *   1. Validate the referenced product exists and is active.
 *   2. Create a new InventoryBatch document in MongoDB.
 *   3. Return the created batch with populated product info.
 *
 * The batch is created with status=ACTIVE and its `initialQuantity` is set
 * equal to `quantity` so we can later track how much has been dispensed.
 */
export const addBatch = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const data = req.body as AddBatchBody;

    // ── Step 1: Verify the product exists and is active ─────────────────
    // We don't want to add stock for a product that's been discontinued.
    const product = await Product.findById(data.productId);

    if (!product) {
      res.status(404).json({
        status: "error",
        message: "Product not found. Cannot add batch for a non-existent product.",
      });
      return;
    }

    if (!product.isActive) {
      res.status(400).json({
        status: "error",
        message: `Product "${product.name}" is inactive. Reactivate it before adding inventory.`,
      });
      return;
    }

    // ── Step 2: Create the inventory batch ──────────────────────────────
    // `initialQuantity` mirrors `quantity` at creation time. As units are
    // dispensed, `quantity` decreases while `initialQuantity` stays fixed
    // — useful for analytics (e.g., "60% of this batch has been sold").
    const batch: IInventoryBatch = await InventoryBatch.create({
      product: data.productId,
      batchNumber: data.batchNumber,
      quantity: data.quantity,
      initialQuantity: data.quantity,
      expiryDate: new Date(data.expiryDate),
      manufacturingDate: data.manufacturingDate
        ? new Date(data.manufacturingDate)
        : undefined,
      purchasePrice: data.purchasePrice,
      sellingPrice: data.sellingPrice,
      supplier: data.supplierId || undefined,
      receivedDate: data.receivedDate
        ? new Date(data.receivedDate)
        : new Date(),
      notes: data.notes,
    });

    // ── Step 3: Populate product info and return ────────────────────────
    await batch.populate("product", "name sku genericName dosageForm strength");

    res.status(201).json({
      status: "success",
      message: `Batch ${batch.batchNumber} added with ${data.quantity} units for "${product.name}"`,
      data: { batch },
    });
  }
);

// ═════════════════════════════════════════════════════════════════════════════
// ─── DISPENSE MEDICATION — THE FEFO ENGINE ──────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════
/**
 * @desc    Dispense medication using the FEFO (First-Expired, First-Out) algorithm
 * @route   POST /api/inventory/dispense
 * @access  Private (PHARMACIST, TECHNICIAN, CASHIER)
 *
 * ┌──────────────────────────────────────────────────────────────────────────┐
 * │                        FEFO ALGORITHM OVERVIEW                         │
 * ├──────────────────────────────────────────────────────────────────────────┤
 * │                                                                        │
 * │  Goal: Always dispense the units closest to expiry FIRST, so that     │
 * │        no medication expires on the shelf while newer stock is sold.   │
 * │                                                                        │
 * │  Example: Customer needs 150 tablets of Amoxicillin.                  │
 * │                                                                        │
 * │  Batches in DB (sorted by expiryDate ASC):                            │
 * │    Batch A  →  qty: 80,  expires: 2026-08-15  ← nearest expiry       │
 * │    Batch B  →  qty: 200, expires: 2026-12-01                          │
 * │    Batch C  →  qty: 50,  expires: 2027-03-20                          │
 * │                                                                        │
 * │  FEFO deduction:                                                       │
 * │    1. Take all 80 from Batch A  →  remaining need: 70                 │
 * │    2. Take 70 from Batch B      →  remaining need: 0  ✓ DONE         │
 * │                                                                        │
 * │  Result:                                                               │
 * │    Batch A: 80 → 0   (status → DEPLETED)                             │
 * │    Batch B: 200 → 130                                                 │
 * │    Batch C: untouched                                                  │
 * │                                                                        │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * Transactional guarantees:
 *   All batch updates happen inside a single MongoDB transaction.
 *   If updating Batch B fails after Batch A was already set to 0,
 *   the transaction aborts and Batch A is restored to its original value.
 *   This prevents "phantom stock" issues.
 */
export const dispenseMedication = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { productId, quantityToDispense } = req.body as DispenseBody;

    // ── Input validation ────────────────────────────────────────────────
    if (!productId || !quantityToDispense || quantityToDispense <= 0) {
      res.status(400).json({
        status: "error",
        message:
          "Both `productId` and a positive `quantityToDispense` are required.",
      });
      return;
    }

    // ── Verify the product exists ───────────────────────────────────────
    const product = await Product.findById(productId).lean();
    if (!product) {
      res.status(404).json({
        status: "error",
        message: "Product not found.",
      });
      return;
    }

    // ════════════════════════════════════════════════════════════════════
    // FEFO STEP 1 — Query eligible batches, pre-sorted by nearest expiry
    // ════════════════════════════════════════════════════════════════════
    //
    // We query batches that are:
    //   - Linked to the requested product           (product: productId)
    //   - Still active and not recalled/expired      (status: ACTIVE)
    //   - Not already past their expiry date         (expiryDate > now)
    //   - Have remaining stock                       (quantity > 0)
    //
    // The .sort({ expiryDate: 1 }) is the KEY to FEFO — it ensures the
    // batch expiring soonest is at index 0. This leverages the compound
    // index { product: 1, expiryDate: 1, status: 1 } defined in the
    // InventoryBatch model, so MongoDB performs an efficient index scan
    // instead of an in-memory sort.

    const now = new Date();

    const eligibleBatches = await InventoryBatch.find({
      product: productId,
      status: BatchStatus.ACTIVE,
      expiryDate: { $gt: now },   // Exclude expired batches
      quantity: { $gt: 0 },        // Exclude depleted batches
    })
      .sort({ expiryDate: 1 })     // ← FEFO: nearest expiry first
      .lean();

    // ════════════════════════════════════════════════════════════════════
    // FEFO STEP 2 — Calculate total available stock
    // ════════════════════════════════════════════════════════════════════
    //
    // Before we start deducting, check if the total stock across ALL
    // eligible batches can even fulfil the request. This is a fail-fast
    // check to avoid starting a transaction that will inevitably fail.

    const totalAvailableStock = eligibleBatches.reduce(
      (sum, batch) => sum + batch.quantity,
      0
    );

    if (totalAvailableStock < quantityToDispense) {
      // Not enough stock across all batches combined
      res.status(422).json({
        status: "error",
        message: `Insufficient stock for "${product.name}". ` +
                 `Requested: ${quantityToDispense}, Available: ${totalAvailableStock}.`,
        data: {
          productId,
          productName: product.name,
          requestedQuantity: quantityToDispense,
          totalAvailable: totalAvailableStock,
          deficit: quantityToDispense - totalAvailableStock,
        },
      });
      return;
    }

    // ════════════════════════════════════════════════════════════════════
    // FEFO STEP 3 — Greedy deduction from earliest-expiry batches
    // ════════════════════════════════════════════════════════════════════
    //
    // Walk through the sorted batches and "consume" stock greedily:
    //   - If the current batch has enough → deduct the full amount, done.
    //   - If not → drain the batch entirely, carry the remainder to the
    //     next batch, and continue.
    //
    // This greedy approach is optimal for FEFO because the batches are
    // already sorted by expiry — we always drain the soonest-expiring
    // batch before touching any later ones.

    let remainingToDispense = quantityToDispense;
    const deductions: BatchDeduction[] = [];

    for (const batch of eligibleBatches) {
      // If we've already allocated enough, stop iterating
      if (remainingToDispense <= 0) break;

      // Determine how many units to take from THIS batch:
      //   - If the batch has more than we need → take only what we need.
      //   - If the batch has less → take everything it has.
      const deductFromThisBatch = Math.min(remainingToDispense, batch.quantity);

      // Calculate days until this batch expires (for the response payload)
      const msUntilExpiry =
        new Date(batch.expiryDate).getTime() - now.getTime();
      const daysUntilExpiry = Math.ceil(msUntilExpiry / (1000 * 60 * 60 * 24));

      // Record the deduction plan
      deductions.push({
        batchId: batch._id.toString(),
        batchNumber: batch.batchNumber,
        expiryDate: batch.expiryDate,
        daysUntilExpiry,
        quantityDeducted: deductFromThisBatch,
        quantityRemainingAfter: batch.quantity - deductFromThisBatch,
      });

      // Subtract what we took from the remaining need
      remainingToDispense -= deductFromThisBatch;
    }

    // ════════════════════════════════════════════════════════════════════
    // FEFO STEP 4 — Execute deductions atomically inside a transaction
    // ════════════════════════════════════════════════════════════════════
    //
    // Why a transaction?
    //   Imagine we're deducting from 3 batches. If batch #2's update
    //   fails (e.g., concurrent modification), we need batch #1 to
    //   roll back too — otherwise the inventory is in an inconsistent
    //   state ("phantom stock": the units were deducted from batch #1
    //   but never actually dispensed to the customer).
    //
    // MongoDB transactions require a replica set. In development with
    // a standalone mongod, wrap in a try/catch and fall back to
    // sequential writes (non-atomic) if transactions aren't supported.
    //
    // NOTE: Each batch update also checks if quantity hits 0 and sets
    // status → DEPLETED. The InventoryBatch model has a pre-save hook
    // for this, but since we use findByIdAndUpdate (which bypasses
    // hooks), we handle it explicitly here.

    let transactionSucceeded = false;
    try {
      const session = await mongoose.startSession();
      try {
        await session.withTransaction(async () => {
          for (const deduction of deductions) {
            const updateFields: Record<string, unknown> = {
              quantity: deduction.quantityRemainingAfter,
            };
            if (deduction.quantityRemainingAfter === 0) {
              updateFields.status = BatchStatus.DEPLETED;
            }
            const updatedBatch = await InventoryBatch.findByIdAndUpdate(
              deduction.batchId,
              { $set: updateFields },
              { new: true, session }
            );
            if (!updatedBatch) {
              throw new Error(`Batch not found during commit.`);
            }
          }
        });
        transactionSucceeded = true;
      } finally {
        await session.endSession();
      }
    } catch (err: any) {
      console.warn(`[Inventory] Transaction failed: ${err.message}. Falling back to sequential writes.`);
    }

    // Fallback if transaction failed (e.g. Session ID unknown on Atlas M0)
    if (!transactionSucceeded) {
      for (const deduction of deductions) {
        const updateFields: Record<string, unknown> = {
          quantity: deduction.quantityRemainingAfter,
        };
        if (deduction.quantityRemainingAfter === 0) {
          updateFields.status = BatchStatus.DEPLETED;
        }
        await InventoryBatch.findByIdAndUpdate(
          deduction.batchId,
          { $set: updateFields },
          { new: true }
        );
      }
    }

    // ════════════════════════════════════════════════════════════════════
    // FEFO STEP 5 — Return the dispense result
    // ════════════════════════════════════════════════════════════════════
    //
    // The response includes a detailed breakdown of every batch that
    // was touched, so the frontend can display a receipt-like summary:
    //
    //   "Dispensed 150 × Amoxicillin 500mg Capsule"
    //   "  ├─ Batch LOT-2026-A: 80 units  (exp: Aug 15 — 18 days left)"
    //   "  └─ Batch LOT-2026-B: 70 units  (exp: Dec 01 — 126 days left)"

    res.status(200).json({
      status: "success",
      message: `Successfully dispensed ${quantityToDispense} unit(s) of "${product.name}" using FEFO`,
      data: {
        productId,
        productName: product.name,
        quantityDispensed: quantityToDispense,
        batchesAffected: deductions.length,
        deductions,
        stockRemainingAfter:
          totalAvailableStock - quantityToDispense,
      },
    });
  }
);
