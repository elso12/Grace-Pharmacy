/**
 * ─── Inventory Validation Schemas (Full-Request Envelope) ─────────────────
 *
 * Zod v4 schemas for inventory batch creation and dispense endpoints.
 * Used with `validateRequest()` middleware (body+query+params envelope).
 *
 * NOTE: These complement the existing `validators/inventory.validators.ts`
 * which use the legacy `validate(schema, source)` signature. The legacy
 * schemas remain in use by `inventory.routes.ts`; these new schemas are
 * wired into `inventoryRoutes.ts`.
 */

import { z } from 'zod';

// ─── Helpers ────────────────────────────────────────────────────────────────
const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const objectId = (name: string) =>
  z.string(`${name} is required`).regex(objectIdRegex, `Invalid ${name} format`);

// ═════════════════════════════════════════════════════════════════════════════
// POST /api/inventory/batch — Add a new inventory batch
// ═════════════════════════════════════════════════════════════════════════════
export const createBatchSchema = z.object({
  body: z.object({
    productId: objectId('Product ID'),

    batchNumber: z
      .string('Batch number is required')
      .min(1, 'Batch number cannot be empty')
      .max(50, 'Batch number too long'),

    quantity: z
      .number('Quantity is required')
      .int('Quantity must be a whole number')
      .min(1, 'Quantity must be at least 1'),

    expiryDate: z
      .string('Expiry date is required')
      .datetime('Expiry date must be a valid ISO 8601 date')
      .refine(
        (date) => new Date(date) > new Date(),
        'Expiry date must be in the future'
      ),

    manufacturingDate: z
      .string()
      .datetime('Manufacturing date must be a valid ISO 8601 date')
      .optional(),

    purchasePrice: z
      .number()
      .min(0, 'Purchase price cannot be negative')
      .optional(),

    costPrice: z
      .number('Cost price is required')
      .min(0, 'Cost price cannot be negative'),

    sellingPrice: z
      .number('Selling price is required')
      .min(0, 'Selling price cannot be negative'),

    storageLocation: z.string().max(100).optional(),

    supplierId: z
      .string()
      .regex(objectIdRegex, 'Invalid Supplier ID format')
      .optional(),

    receivedDate: z
      .string()
      .datetime('Received date must be a valid ISO 8601 date')
      .optional(),

    notes: z.string().max(500, 'Notes too long').optional(),
  }),
});

export type CreateBatchInput = z.infer<typeof createBatchSchema>['body'];

// ═════════════════════════════════════════════════════════════════════════════
// POST /api/inventory/dispense — Dispense medication (FEFO)
// ═════════════════════════════════════════════════════════════════════════════
export const dispenseSchema = z.object({
  body: z.object({
    productId: objectId('Product ID'),

    quantityToDispense: z
      .number('Quantity is required')
      .int('Quantity must be a whole number')
      .min(1, 'Quantity must be at least 1'),
  }),
});

export type DispenseInput = z.infer<typeof dispenseSchema>['body'];
