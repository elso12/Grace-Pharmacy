import mongoose, { Schema, type Document, type Model } from 'mongoose';

// ─── B2C Storefront Category Enum ────────────────────────────────────────────
// These are the consumer-facing shelf categories displayed on the storefront.
// Kept separate from the internal B2B ProductCategory enum in types/enums.ts.
export enum StorefrontCategory {
  Vitamins    = 'Vitamins',
  PainRelief  = 'Pain Relief',
  Allergy     = 'Allergy',
  FirstAid    = 'First Aid',
  MotherBaby  = 'Mother & Baby',
}

/**
 * Interface representing a B2C storefront Product document in MongoDB.
 */
export interface IStorefrontProduct extends Document {
  name:                 string;
  description?:        string;
  category:             StorefrontCategory;
  price:                number;
  requiresPrescription: boolean;
  manufacturer?:       string;
  imageUrl?:           string;
  createdAt:            Date;
  updatedAt:            Date;
}

export interface IStorefrontProductModel extends Model<IStorefrontProduct> {}

// ─── Schema ───────────────────────────────────────────────────────────────────
const storefrontProductSchema = new Schema<IStorefrontProduct>(
  {
    name: {
      type:     String,
      required: [true, 'Product name is required'],
      trim:     true,
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type:     String,
      enum: {
        values:  Object.values(StorefrontCategory),
        message: '{VALUE} is not a valid storefront category',
      },
      required: [true, 'Product category is required'],
    },
    price: {
      type:     Number,
      required: [true, 'Price is required'],
      min:      [0, 'Price cannot be negative'],
    },
    requiresPrescription: {
      type:    Boolean,
      default: false,
    },
    manufacturer: {
      type: String,
      trim: true,
    },
    imageUrl: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON:     { virtuals: true },
    toObject:   { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
// Compound index for fast filtered listings by category
storefrontProductSchema.index({ category: 1 });

// Text index for full-text search across name and manufacturer
storefrontProductSchema.index(
  { name: 'text', description: 'text', manufacturer: 'text' },
  { name: 'storefront_product_text' }
);

// ─── Model Export ─────────────────────────────────────────────────────────────
// Use 'StorefrontProduct' as the Mongoose model name to avoid conflicting
// with the existing internal 'Product' model (Product.model.ts).
const StorefrontProduct: IStorefrontProductModel =
  mongoose.model<IStorefrontProduct, IStorefrontProductModel>(
    'StorefrontProduct',
    storefrontProductSchema
  );

export default StorefrontProduct;
