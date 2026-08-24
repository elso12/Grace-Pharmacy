/**
 * ─── FEFO Allocation Engine (Pure Function) ─────────────────────────────────
 *
 * Deterministic, database-free First-Expired-First-Out allocation logic.
 * Extracted from the inventory service so it can be unit-tested without
 * MongoDB or any I/O dependencies.
 *
 * The service layer (`inventory.service.ts`) handles DB queries and
 * transactions; this module handles the pure algorithmic allocation.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

/** A batch record as fed into the allocation engine */
export interface BatchInput {
  batchId: string;
  batchNumber: string;
  quantity: number;
  expiryDate: Date;
  sellingPrice: number;
  status: string;
}

/** A single deduction produced by the FEFO allocation */
export interface Deduction {
  batchId: string;
  batchNumber: string;
  expiryDate: Date;
  daysUntilExpiry: number;
  quantityToDeduct: number;
  remainingAfterDeduction: number;
  sellingPrice: number;
}

// ─── Error ──────────────────────────────────────────────────────────────────

/**
 * Thrown when the total available (ACTIVE, non-expired) stock across all
 * batches is less than the requested quantity.
 */
export class InsufficientStockError extends Error {
  public readonly requested: number;
  public readonly available: number;

  constructor(requested: number, available: number) {
    super(
      `Insufficient stock: requested ${requested} units but only ${available} available`
    );
    this.name = 'InsufficientStockError';
    this.requested = requested;
    this.available = available;
    Object.setPrototypeOf(this, InsufficientStockError.prototype);
  }
}

// ─── Constants ──────────────────────────────────────────────────────────────

/** Batch statuses that are eligible for dispensing */
const ACTIVE_STATUS = 'ACTIVE';

// ─── Core Algorithm ─────────────────────────────────────────────────────────

/**
 * Allocates stock from the given batches using First-Expired-First-Out:
 *
 * 1. Filters out non-ACTIVE, already-expired, and zero-quantity batches.
 * 2. Sorts remaining batches by `expiryDate` ascending (nearest expiry first).
 * 3. Greedily deducts from each batch until the requested quantity is met.
 * 4. Throws `InsufficientStockError` if total available < requested.
 *
 * @param batches       Raw batch list (any order, may contain ineligible batches)
 * @param requestedQty  Number of units to allocate
 * @param now           Reference "now" timestamp (defaults to current time)
 * @returns             Ordered array of deductions
 */
export function allocateFefo(
  batches: BatchInput[],
  requestedQty: number,
  now: Date = new Date()
): Deduction[] {
  // ── Step 1: Filter eligible batches ─────────────────────────────────────
  const eligible = batches.filter(
    (b) =>
      b.status === ACTIVE_STATUS &&
      b.quantity > 0 &&
      new Date(b.expiryDate).getTime() > now.getTime()
  );

  // ── Step 2: Sort by nearest expiry first ────────────────────────────────
  eligible.sort(
    (a, b) =>
      new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
  );

  // ── Step 3: Check total availability ────────────────────────────────────
  const totalAvailable = eligible.reduce((sum, b) => sum + b.quantity, 0);
  if (totalAvailable < requestedQty) {
    throw new InsufficientStockError(requestedQty, totalAvailable);
  }

  // ── Step 4: Greedy allocation ───────────────────────────────────────────
  let remaining = requestedQty;
  const deductions: Deduction[] = [];

  for (const batch of eligible) {
    if (remaining <= 0) break;

    const deductQty = Math.min(remaining, batch.quantity);
    const expiryTime = new Date(batch.expiryDate).getTime();
    const daysUntilExpiry = Math.ceil(
      (expiryTime - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    deductions.push({
      batchId: batch.batchId,
      batchNumber: batch.batchNumber,
      expiryDate: batch.expiryDate,
      daysUntilExpiry,
      quantityToDeduct: deductQty,
      remainingAfterDeduction: batch.quantity - deductQty,
      sellingPrice: batch.sellingPrice,
    });

    remaining -= deductQty;
  }

  return deductions;
}
