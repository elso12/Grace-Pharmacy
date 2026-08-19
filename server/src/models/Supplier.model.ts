/**
 * ─── Supplier Model ───────────────────────────────────────────────────────
 * Tracks pharmaceutical suppliers/distributors for batch traceability.
 * Referenced by InventoryBatch to trace product sourcing.
 *
 * @index { name: 1 }        — Alphabetical supplier listing
 * @index { email: 1 }       — Unique sparse for email lookups
 * @index { isActive: 1 }    — Filter active/inactive suppliers
 */

import mongoose, { Schema, type Document } from "mongoose";

// ─── Interface ──────────────────────────────────────────────────────────────
export interface ISupplier extends Document {
  /** Company or distributor name */
  name: string;

  /** Primary contact person */
  contactPerson?: string;

  /** Contact email */
  email?: string;

  /** Contact phone number */
  phone: string;

  /** Business address */
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };

  /** Drug license or registration number */
  licenseNumber?: string;

  /** Payment terms (e.g., 'Net 30', 'COD') */
  paymentTerms?: string;

  /** Whether this supplier is currently active */
  isActive: boolean;

  /** Internal notes */
  notes?: string;
}

// ─── Schema ─────────────────────────────────────────────────────────────────
const supplierSchema = new Schema<ISupplier>(
  {
    name: {
      type: String,
      required: [true, "Supplier name is required"],
      trim: true,
    },

    contactPerson: {
      type: String,
      trim: true,
    },

    email: {
      type: String,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      required: [true, "Supplier phone is required"],
      trim: true,
    },

    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },

    licenseNumber: {
      type: String,
      trim: true,
    },

    paymentTerms: {
      type: String,
      trim: true,
      default: "Net 30",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    notes: String,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ────────────────────────────────────────────────────────────────
supplierSchema.index({ name: 1 });
supplierSchema.index({ email: 1 }, { unique: true, sparse: true });
supplierSchema.index({ isActive: 1 });

// ─── Export ─────────────────────────────────────────────────────────────────
export default mongoose.model<ISupplier>("Supplier", supplierSchema);
