/**
 * ─── Product Validation Schemas ───────────────────────────────────────────
 *
 * Zod v4 schemas for product CRUD and catalog query endpoints.
 * Used with `validateRequest()` middleware.
 */

import { z } from 'zod';
import { ProductCategory } from '../types/enums';

// ─── Helpers ────────────────────────────────────────────────────────────────
const objectIdRegex = /^[0-9a-fA-F]{24}$/;

// ═════════════════════════════════════════════════════════════════════════════
// POST /api/products — Create a new product
// ═════════════════════════════════════════════════════════════════════════════
export const createProductSchema = z.object({
  body: z.object({
    name: z
      .string('Product name is required')
      .min(1, 'Product name cannot be empty')
      .max(200, 'Product name too long'),

    genericName: z
      .string('Generic name is required')
      .min(1, 'Generic name cannot be empty')
      .max(200, 'Generic name too long'),

    category: z.nativeEnum(ProductCategory, {
      error: 'Invalid product category',
    }),

    dosageForm: z.string().trim().optional(),
    strength: z.string().trim().optional(),
    manufacturer: z.string().trim().optional(),
    description: z.string().trim().max(2000, 'Description too long').optional(),
    barcode: z.string().trim().optional(),

    unit: z.string().trim().default('pcs'),

    unitPrice: z
      .number('Unit price is required')
      .positive('Unit price must be greater than 0'),

    reorderLevel: z
      .number()
      .int('Reorder level must be a whole number')
      .min(0, 'Reorder level cannot be negative')
      .default(10),

    requiresPrescription: z.boolean().default(false),

    imageUrl: z.string().url('Invalid image URL').optional(),

    /** Optional inline initial batch (handled by productController) */
    initialBatch: z.object({
      batchNumber: z.string().min(1, 'Batch number is required'),
      quantity: z.number().int().min(1, 'Quantity must be at least 1'),
      expiryDate: z.string().datetime('Expiry date must be a valid ISO 8601 date'),
      costPrice: z.number().min(0, 'Cost price cannot be negative').optional(),
      shelfLocation: z.string().optional(),
    }).optional(),
  }),
});

export type CreateProductInput = z.infer<typeof createProductSchema>['body'];

// ═════════════════════════════════════════════════════════════════════════════
// PUT /api/products/:id — Update a product
// ═════════════════════════════════════════════════════════════════════════════
export const updateProductSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid product ID'),
  }),
  body: z.object({
    name: z.string().min(1).max(200).optional(),
    genericName: z.string().min(1).max(200).optional(),
    category: z.nativeEnum(ProductCategory).optional(),
    dosageForm: z.string().trim().optional(),
    strength: z.string().trim().optional(),
    manufacturer: z.string().trim().optional(),
    description: z.string().trim().max(2000).optional(),
    unit: z.string().trim().optional(),
    unitPrice: z.number().positive('Unit price must be greater than 0').optional(),
    reorderLevel: z.number().int().min(0).optional(),
    requiresPrescription: z.boolean().optional(),
    imageUrl: z.string().url().optional(),
    isActive: z.boolean().optional(),
  }),
});

export type UpdateProductInput = z.infer<typeof updateProductSchema>['body'];

// ═════════════════════════════════════════════════════════════════════════════
// GET /api/products — Query product catalog (B2C storefront)
// ═════════════════════════════════════════════════════════════════════════════
export const queryProductSchema = z.object({
  query: z.object({
    page: z.coerce
      .number()
      .int()
      .min(1, 'Page must be at least 1')
      .default(1),

    limit: z.coerce
      .number()
      .int()
      .min(1, 'Limit must be at least 1')
      .max(100, 'Limit cannot exceed 100')
      .default(10),

    search: z.string().trim().optional(),

    category: z.nativeEnum(ProductCategory).optional(),

    requiresPrescription: z
      .enum(['true', 'false'])
      .transform((v) => v === 'true')
      .optional(),

    all: z
      .enum(['true', 'false'])
      .default('false'),
  }),
});

export type QueryProductInput = z.infer<typeof queryProductSchema>['query'];
