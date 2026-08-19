import mongoose, { Schema, type Document, type Model, Types } from 'mongoose';
import { PaymentMethod, SaleStatus } from '../types/enums';

/**
 * Interface representing an individual item within a Sale transaction.
 */
export interface ISaleItem {
  product: Types.ObjectId;
  batchId: Types.ObjectId;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  lineTotal: number;
  requiresPrescription: boolean;
  prescription?: Types.ObjectId;
}

/**
 * Interface representing a Sale document in MongoDB.
 */
export interface ISale extends Document {
  invoiceNumber: string;
  customer?: Types.ObjectId;
  items: ISaleItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountTotal: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  changeGiven: number;
  status: SaleStatus;
  dispensedBy: Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Sub-schema: Sale Item ───────────────────────────────────────────────────
const saleItemSchema = new Schema<ISaleItem>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product reference is required'],
    },
    batchId: {
      type: Schema.Types.ObjectId,
      ref: 'InventoryBatch',
      required: [true, 'Batch reference is required'],
    },
    productName: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    unitPrice: {
      type: Number,
      required: [true, 'Unit price is required'],
      min: [0, 'Unit price cannot be negative'],
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, 'Discount cannot be negative'],
    },
    lineTotal: {
      type: Number,
      required: [true, 'Line total is required'],
    },
    requiresPrescription: {
      type: Boolean,
      required: true,
      default: false,
    },
    prescription: {
      type: Schema.Types.ObjectId,
      ref: 'Prescription',
    },
  },
  { _id: false }
);

// ─── Main Schema: Sale ───────────────────────────────────────────────────────
const saleSchema = new Schema<ISale>(
  {
    invoiceNumber: {
      type: String,
      required: [true, 'Invoice number is required'],
      unique: true,
      trim: true,
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
    },
    items: {
      type: [saleItemSchema],
      required: [true, 'Sale items are required'],
      validate: [
        (items: ISaleItem[]) => Array.isArray(items) && items.length > 0,
        'Sale must contain at least one item',
      ],
    },
    subtotal: {
      type: Number,
      required: [true, 'Subtotal is required'],
      min: [0, 'Subtotal cannot be negative'],
    },
    taxRate: {
      type: Number,
      default: 0,
      min: [0, 'Tax rate cannot be negative'],
      max: [100, 'Tax rate cannot exceed 100%'],
    },
    taxAmount: {
      type: Number,
      required: [true, 'Tax amount is required'],
      min: [0, 'Tax amount cannot be negative'],
    },
    discountTotal: {
      type: Number,
      default: 0,
      min: [0, 'Total discount cannot be negative'],
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount cannot be negative'],
    },
    paymentMethod: {
      type: String,
      enum: Object.values(PaymentMethod),
      required: [true, 'Payment method is required'],
    },
    amountPaid: {
      type: Number,
      required: [true, 'Amount paid is required'],
      min: [0, 'Amount paid cannot be negative'],
    },
    changeGiven: {
      type: Number,
      default: 0,
      min: [0, 'Change given cannot be negative'],
    },
    status: {
      type: String,
      enum: Object.values(SaleStatus),
      default: SaleStatus.COMPLETED,
    },
    dispensedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Dispensed by user reference is required'],
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Virtual Fields ──────────────────────────────────────────────────────────
saleSchema.virtual('itemCount').get(function (this: ISale) {
  if (!this.items) return 0;
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

// ─── Strategic Indexes ───────────────────────────────────────────────────────
// saleSchema.index({ invoiceNumber: 1 }, { unique: true });
saleSchema.index({ customer: 1, createdAt: -1 });
saleSchema.index({ dispensedBy: 1, createdAt: -1 });
saleSchema.index({ createdAt: -1, status: 1 });
saleSchema.index({ paymentMethod: 1, createdAt: -1 });
saleSchema.index({ status: 1 });

// ─── Hooks ───────────────────────────────────────────────────────────────────

/**
 * Pre-validate hook to auto-generate unique invoice number if not already present.
 * Format: INV-YYYYMMDD-XXXXX (where XXXXX is random uppercase alphanumeric)
 */
saleSchema.pre('validate', function (next) {
  if (!this.invoiceNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let randomStr = '';
    for (let i = 0; i < 5; i++) {
      randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    this.invoiceNumber = `INV-${dateStr}-${randomStr}`;
  }
  next();
});

/**
 * Pre-save hook to calculate item line totals, subtotal, tax amount, total amount, and change given.
 */
saleSchema.pre('save', function (next) {
  if (this.items && this.items.length > 0) {
    let computedSubtotal = 0;
    for (const item of this.items) {
      const discount = item.discount || 0;
      item.lineTotal = item.quantity * item.unitPrice - discount;
      computedSubtotal += item.lineTotal;
    }
    this.subtotal = computedSubtotal;
  } else {
    this.subtotal = 0;
  }

  const taxRate = this.taxRate || 0;
  this.taxAmount = (this.subtotal * taxRate) / 100;

  const discountTotal = this.discountTotal || 0;
  this.totalAmount = this.subtotal + this.taxAmount - discountTotal;

  const amountPaid = this.amountPaid || 0;
  this.changeGiven = amountPaid - this.totalAmount;

  next();
});

// ─── Export Model ────────────────────────────────────────────────────────────
const Sale: Model<ISale> = mongoose.model<ISale>('Sale', saleSchema);
export default Sale;
