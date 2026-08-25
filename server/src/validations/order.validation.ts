/**
 * ─── Order & Sale Validation Schemas ──────────────────────────────────────
 *
 * Zod v4 schemas for the B2C checkout and POS sale endpoints.
 * Used with `validateRequest()` middleware.
 */

import { z } from 'zod';
import { FulfillmentType, PaymentMethod, OrderStatus } from '../types/enums';

// ─── Helpers ────────────────────────────────────────────────────────────────
const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const objectId = (name: string) =>
  z.string(`${name} is required`).regex(objectIdRegex, `Invalid ${name} format`);

// ─── Shared sub-schemas ─────────────────────────────────────────────────────
const orderItemSchema = z.object({
  medicationId: objectId('Medication ID'),
  quantity: z
    .number('Quantity is required')
    .int('Quantity must be a whole number')
    .min(1, 'Quantity must be at least 1'),
  /** priceAtPurchase is calculated server-side, but accepted if pre-computed */
  priceAtPurchase: z.number().min(0).optional(),
});

const shippingAddressSchema = z.object({
  street: z.string('Street is required').min(1, 'Street cannot be empty'),
  city: z.string('City is required').min(1, 'City cannot be empty'),
  zip: z.string('ZIP code is required').min(1, 'ZIP code cannot be empty'),
});

// ═════════════════════════════════════════════════════════════════════════════
// POST /api/orders/checkout — B2C online checkout
// ═════════════════════════════════════════════════════════════════════════════
export const checkoutSchema = z.object({
  body: z.object({
    items: z
      .array(
        z.object({
          productId: z.string().min(1, 'Product ID is required'),
          name: z.string().optional(),
          quantity: z.number().int().positive('Quantity must be at least 1'),
          unitPrice: z.number().positive('Unit price must be positive'),
        })
      )
      .min(1, 'Cart cannot be empty'),

    fulfillmentType: z.enum(['STORE_PICKUP', 'HOME_DELIVERY'], {
      message: 'Fulfillment type must be STORE_PICKUP or HOME_DELIVERY',
    }),

    deliveryAddress: z.string().optional().nullable(),
    deliveryPhone: z.string().optional().nullable(),

    paymentMethod: z.enum(['CASH', 'CARD', 'MOBILE_WALLET', 'INSURANCE'], {
      message: 'Invalid payment method selected',
    }),

    // Payment Details (Optional depending on method)
    paymentDetails: z
      .object({
        cardNumber: z.string().optional(),
        cardExpiry: z.string().optional(),
        walletPhone: z.string().optional().nullable(),
        walletProvider: z.enum(['TELEBIRR', 'CBE_BIRR', 'BOA', 'AWASH_BIRR', 'OTHER']).optional().nullable(),
        transactionReference: z.string().optional().nullable(),
        insuranceProvider: z.string().optional(),
        policyNumber: z.string().optional(),
      })
      .optional(),

    prescriptionImageUrl: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
  }).refine(
    (data) => {
      // If Home Delivery is chosen, deliveryAddress and phone are required
      if (data.fulfillmentType === 'HOME_DELIVERY') {
        return !!data.deliveryAddress && data.deliveryAddress.trim().length > 0;
      }
      return true;
    },
    {
      message: 'Delivery address is required for Home Delivery',
      path: ['deliveryAddress'],
    }
  ),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>['body'];

// ═════════════════════════════════════════════════════════════════════════════
// POST /api/sales/pos — POS in-store sale
// ═════════════════════════════════════════════════════════════════════════════
export const posSaleSchema = z.object({
  body: z.object({
    items: z
      .array(orderItemSchema)
      .min(1, 'Cart must contain at least one item'),

    paymentMethod: z.nativeEnum(PaymentMethod, {
      error: 'Invalid payment method',
    }).default(PaymentMethod.CASH),

    walletProvider: z.enum(['TELEBIRR', 'CBE_BIRR', 'BOA', 'AWASH_BIRR', 'OTHER']).optional().nullable(),
    walletPhone: z.string().optional().nullable(),
    transactionReference: z.string().optional().nullable(),

    prescriptionId: z
      .string()
      .regex(objectIdRegex, 'Invalid Prescription ID')
      .optional(),
  }),
});

export type PosSaleInput = z.infer<typeof posSaleSchema>['body'];

// ═════════════════════════════════════════════════════════════════════════════
// PATCH /api/orders/:id/status — Update order status
// ═════════════════════════════════════════════════════════════════════════════
export const updateOrderStatusSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid order ID'),
  }),
  body: z.object({
    status: z.nativeEnum(OrderStatus, {
      error: 'Invalid order status',
    }),
  }),
});

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
