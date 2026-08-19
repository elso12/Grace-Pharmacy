/**
 * ─── Inventory Validation Schemas ─────────────────────────────────────────
 * Zod v4 schemas for all inventory endpoints. Each schema validates,
 * coerces, and transforms incoming request data before it reaches
 * the controller.
 *
 * Zod v4 API notes:
 *   - Error messages use z.string("message") instead of { required_error }
 *   - z.coerce.number() for query param string → number coercion
 *   - z.nativeEnum() for TypeScript enums
 */

import { z } from "zod";
import { BatchStatus } from "../types/enums";

// ─── Helpers ────────────────────────────────────────────────────────────────
const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const objectId = (fieldName: string) =>
  z.string(`${fieldName} is required`).regex(objectIdRegex, `Invalid ${fieldName} format`);

const isoDate = (fieldName: string) =>
  z.string(`${fieldName} is required`).datetime(`${fieldName} must be a valid ISO 8601 date`);

// ─── POST /api/inventory/batches ────────────────────────────────────────────
// Validates the request body when adding a new inventory batch.
export const addBatchSchema = z.object({
  /** MongoDB ObjectId of the product this batch belongs to */
  productId: objectId("Product ID"),

  /** Unique batch identifier (e.g., LOT-2026-001) */
  batchNumber: z
    .string("Batch number is required")
    .min(1, "Batch number cannot be empty")
    .max(50, "Batch number too long"),

  /** Number of units received */
  quantity: z
    .number("Quantity is required")
    .int("Quantity must be a whole number")
    .min(1, "Quantity must be at least 1"),

  /** Batch expiration date (ISO 8601 string → Date) */
  expiryDate: isoDate("Expiry date").refine(
    (date) => new Date(date) > new Date(),
    "Expiry date must be in the future"
  ),

  /** Optional manufacturing date */
  manufacturingDate: z
    .string()
    .datetime("Manufacturing date must be a valid ISO 8601 date")
    .optional(),

  /** Cost per unit from the supplier (legacy/alias) */
  purchasePrice: z
    .number("Purchase price is required")
    .min(0, "Purchase price cannot be negative")
    .optional(),

  /** Standardized cost per unit from the supplier */
  costPrice: z
    .number("Cost price is required")
    .min(0, "Cost price cannot be negative"),

  /** Retail price per unit */
  sellingPrice: z
    .number("Selling price is required")
    .min(0, "Selling price cannot be negative"),

  /** Physical location in the warehouse/store */
  storageLocation: z.string().max(100, "Storage location too long").optional(),

  /** Optional supplier ObjectId */
  supplierId: z
    .string()
    .regex(objectIdRegex, "Invalid Supplier ID format")
    .optional(),

  /** Date the batch was received (defaults to now) */
  receivedDate: z
    .string()
    .datetime("Received date must be a valid ISO 8601 date")
    .optional(),

  /** Optional internal notes */
  notes: z.string().max(500, "Notes too long").optional(),
});

/** Inferred type for the add-batch request body */
export type AddBatchInput = z.infer<typeof addBatchSchema>;

// ─── GET /api/inventory/fefo-dispense?productId=X&quantity=Y ────────────────
// Query params: string → coerced to proper types.
export const fefoDispenseSchema = z.object({
  /** Product to dispense from */
  productId: objectId("productId"),

  /** Number of units to dispense */
  quantity: z.coerce
    .number("quantity query parameter is required")
    .int("Quantity must be a whole number")
    .min(1, "Quantity must be at least 1"),
});

export type FefoDispenseInput = z.infer<typeof fefoDispenseSchema>;

// ─── GET /api/inventory/alerts/expiry?days=N ────────────────────────────────
export const expiryAlertSchema = z.object({
  /** Number of days to look ahead (default 30) */
  days: z.coerce
    .number()
    .int("Days must be a whole number")
    .min(1, "Days must be at least 1")
    .max(365, "Days cannot exceed 365")
    .default(30),

  /** Filter by batch status (default: ACTIVE) */
  status: z
    .nativeEnum(BatchStatus)
    .default(BatchStatus.ACTIVE),
});

export type ExpiryAlertInput = z.infer<typeof expiryAlertSchema>;

// ─── GET /api/inventory/alerts/low-stock?threshold=N ────────────────────────
export const lowStockAlertSchema = z.object({
  /** Override the product's own reorderLevel (optional) */
  threshold: z.coerce
    .number()
    .int("Threshold must be a whole number")
    .min(0, "Threshold cannot be negative")
    .optional(),

  /** Include inactive products in results */
  includeInactive: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .default(false),
});

export type LowStockAlertInput = z.infer<typeof lowStockAlertSchema>;
