import mongoose, { Schema, type Document, type Model, Types } from 'mongoose';
import { ProductCategory } from '../types/enums';

/**
 * Interface representing a Product document in MongoDB.
 */
export interface IProduct extends Document {
  tenantId: Types.ObjectId;
  name: string;
  genericName: string;
  sku: string;
  barcode?: string;
  category: ProductCategory;
  description?: string;
  manufacturer?: string;
  dosageForm?: string;
  strength?: string;
  unit: string;
  requiresPrescription: boolean;
  reorderLevel: number;
  isActive: boolean;
  shelfLocation?: {
    aisle?: string;
    rack?: string;
    shelf?: string;
    bin?: string;
  };
  createdAt: Date;
  updatedAt: Date;

  // Virtuals
  displayName: string;
}

/**
 * Interface for Product Model representing static model methods.
 */
export interface IProductModel extends Model<IProduct> {}

/**
 * Schema definition for the Product model.
 */
const productSchema = new Schema<IProduct>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    genericName: {
      type: String,
      required: [true, 'Generic name is required'],
      trim: true,
      lowercase: true,
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    barcode: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    category: {
      type: String,
      enum: {
        values: Object.values(ProductCategory),
        message: '{VALUE} is not a valid product category',
      },
      required: [true, 'Product category is required'],
    },
    description: {
      type: String,
      trim: true,
    },
    manufacturer: {
      type: String,
      trim: true,
    },
    dosageForm: {
      type: String,
      trim: true,
    },
    strength: {
      type: String,
      trim: true,
    },
    unit: {
      type: String,
      required: [true, 'Unit of measurement is required'],
      default: 'pcs',
      trim: true,
    },
    requiresPrescription: {
      type: Boolean,
      default: false,
    },
    reorderLevel: {
      type: Number,
      required: [true, 'Reorder level is required'],
      min: [0, 'Reorder level cannot be negative'],
      default: 10,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    shelfLocation: {
      aisle: { type: String, trim: true },
      rack: { type: String, trim: true },
      shelf: { type: String, trim: true },
      bin: { type: String, trim: true },
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Strategic Indexes ────────────────────────────────────────────────────────
// Unique index on SKU
// productSchema.index({ sku: 1 }, { unique: true });

// Sparse unique index on Barcode
// productSchema.index({ barcode: 1 }, { unique: true, sparse: true });

// Compound index for drug matching by generic name and dosage form
productSchema.index({ genericName: 1, dosageForm: 1 });

// Compound index for filtered listings by category and active status
productSchema.index({ category: 1, isActive: 1 });

// Text index for full-text search across name, genericName, and manufacturer
productSchema.index({
  name: 'text',
  genericName: 'text',
  manufacturer: 'text',
});

// ─── Virtual Fields ───────────────────────────────────────────────────────────
/**
 * Formatted display name combining name, strength, and dosage form.
 * Example: "Paracetamol 500mg Tablet"
 */
productSchema.virtual('displayName').get(function (this: IProduct) {
  const parts = [this.name];
  if (this.strength) parts.push(this.strength);
  if (this.dosageForm) parts.push(this.dosageForm);
  return parts.join(' ');
});

// ─── Model Export ─────────────────────────────────────────────────────────────
const Product: IProductModel = mongoose.model<IProduct, IProductModel>('Product', productSchema);

export default Product;
