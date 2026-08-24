import { describe, it, expect } from 'vitest';
import {
  allocateFefo,
  InsufficientStockError,
  type BatchInput,
} from '../utils/fefo.engine';

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Returns a Date that is `days` days from `base`. */
const daysFromNow = (days: number, base: Date = new Date('2026-06-01')): Date =>
  new Date(base.getTime() + days * 24 * 60 * 60 * 1000);

/** Frozen reference time for deterministic tests. */
const NOW = new Date('2026-06-01T00:00:00Z');

// ═════════════════════════════════════════════════════════════════════════════
// ─── TEST SUITE ─────────────────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

describe('FEFO Allocation Engine', () => {

  // ── Test 1 ──────────────────────────────────────────────────────────────
  it('should deduct 15 from the batch expiring in 25 days and 5 from the batch expiring in 450 days when ordering 20 units', () => {
    const batches: BatchInput[] = [
      {
        batchId: 'batch-a',
        batchNumber: 'B-NEAR',
        quantity: 15,
        expiryDate: daysFromNow(25, NOW),   // expires in 25 days
        sellingPrice: 10,
        status: 'ACTIVE',
      },
      {
        batchId: 'batch-b',
        batchNumber: 'B-FAR',
        quantity: 30,
        expiryDate: daysFromNow(450, NOW),  // expires in 450 days
        sellingPrice: 10,
        status: 'ACTIVE',
      },
    ];

    const deductions = allocateFefo(batches, 20, NOW);

    // Exactly 2 deductions (both batches touched)
    expect(deductions).toHaveLength(2);

    // First deduction: entire near-expiry batch (15 units)
    expect(deductions[0].batchId).toBe('batch-a');
    expect(deductions[0].quantityToDeduct).toBe(15);
    expect(deductions[0].remainingAfterDeduction).toBe(0);

    // Second deduction: 5 units from the far-expiry batch
    expect(deductions[1].batchId).toBe('batch-b');
    expect(deductions[1].quantityToDeduct).toBe(5);
    expect(deductions[1].remainingAfterDeduction).toBe(25);
  });

  // ── Test 2 ──────────────────────────────────────────────────────────────
  it('should exclude quarantined, expired-status, and past-expiry batches from allocation', () => {
    const batches: BatchInput[] = [
      {
        batchId: 'quarantined-1',
        batchNumber: 'B-QUAR',
        quantity: 50,
        expiryDate: daysFromNow(100, NOW),
        sellingPrice: 8,
        status: 'QUARANTINED',               // ← excluded: wrong status
      },
      {
        batchId: 'expired-status-2',
        batchNumber: 'B-EXP-S',
        quantity: 30,
        expiryDate: daysFromNow(200, NOW),
        sellingPrice: 9,
        status: 'EXPIRED',                   // ← excluded: wrong status
      },
      {
        batchId: 'past-expiry-3',
        batchNumber: 'B-PAST',
        quantity: 20,
        expiryDate: daysFromNow(-10, NOW),    // ← excluded: already expired
        sellingPrice: 7,
        status: 'ACTIVE',
      },
      {
        batchId: 'valid-4',
        batchNumber: 'B-VALID',
        quantity: 10,
        expiryDate: daysFromNow(60, NOW),     // ← eligible
        sellingPrice: 12,
        status: 'ACTIVE',
      },
    ];

    const deductions = allocateFefo(batches, 10, NOW);

    // Only the single valid batch should be touched
    expect(deductions).toHaveLength(1);
    expect(deductions[0].batchId).toBe('valid-4');
    expect(deductions[0].quantityToDeduct).toBe(10);
  });

  // ── Test 3 ──────────────────────────────────────────────────────────────
  it('should throw InsufficientStockError when requested quantity exceeds total available', () => {
    const batches: BatchInput[] = [
      {
        batchId: 'small-1',
        batchNumber: 'B-SMALL',
        quantity: 5,
        expiryDate: daysFromNow(30, NOW),
        sellingPrice: 10,
        status: 'ACTIVE',
      },
    ];

    expect(() => allocateFefo(batches, 100, NOW)).toThrowError(
      InsufficientStockError
    );

    // Verify error properties
    try {
      allocateFefo(batches, 100, NOW);
    } catch (err) {
      expect(err).toBeInstanceOf(InsufficientStockError);
      expect((err as InsufficientStockError).requested).toBe(100);
      expect((err as InsufficientStockError).available).toBe(5);
    }
  });
});
