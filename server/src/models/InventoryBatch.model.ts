import mongoose, { Schema, type Document, Types } from 'mongoose';
import { BatchStatus } from '../types/enums';

/**
 * Interface representing an InventoryBatch document in Mongoose.
 */
export interface IInventoryBatch extends Document {
  tenantId: Types.ObjectId;
  product: Types.ObjectId;
  branchId: Types.ObjectId;
  batchNumber: string;
  quantity: number;
  initialQuantity: number;
  expiryDate: Date;
  manufacturingDate?: Date;
  purchasePrice: number;
  costPrice: number;
  sellingPrice: number;
  storageLocation?: string;
  supplier?: Types.ObjectId;
  receivedDate: Date;
  status: BatchStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;

  // Virtual getters
  isExpired: boolean;
  profitMargin: string;
  daysUntilExpiry: number;
}

/**
 * Mongoose Schema for InventoryBatch.
 */
const inventoryBatchSchema = new Schema<IInventoryBatch>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product reference is required'],
    },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Branch reference is required'],
    },
    batchNumber: {
      type: String,
      required: [true, 'Batch number is required'],
      uppercase: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0, 'Quantity cannot be negative'],
    },
    initialQuantity: {
      type: Number,
      required: [true, 'Initial quantity is required'],
      min: [1, 'Initial quantity must be at least 1'],
    },
    expiryDate: {
      type: Date,
      required: [true, 'Expiry date is required'],
    },
    manufacturingDate: {
      type: Date,
    },
    purchasePrice: {
      type: Number,
      required: [true, 'Purchase price is required'],
      min: [0, 'Purchase price cannot be negative'],
    },
    costPrice: {
      type: Number,
      required: [true, 'Cost price is required'],
      min: [0, 'Cost price cannot be negative'],
    },
    sellingPrice: {
      type: Number,
      required: [true, 'Selling price is required'],
      min: [0, 'Selling price cannot be negative'],
    },
    storageLocation: {
      type: String,
      trim: true,
    },
    supplier: {
      type: Schema.Types.ObjectId,
      ref: 'Supplier',
    },
    receivedDate: {
      type: Date,
      required: [true, 'Received date is required'],
      default: Date.now,
    },
    status: {
      type: String,
      enum: Object.values(BatchStatus),
      default: BatchStatus.ACTIVE,
      required: true,
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

// ─── Indexes ─────────────────────────────────────────────────────────────────

// Compound index for FEFO (First Expired First Out) sorting: find active batches of a product sorted by nearest expiry
inventoryBatchSchema.index({ product: 1, expiryDate: 1, status: 1 });

// Prevent duplicate batch entries per product
inventoryBatchSchema.index({ product: 1, batchNumber: 1 }, { unique: true });

// Index for expiry monitoring dashboard queries
inventoryBatchSchema.index({ expiryDate: 1, status: 1 });

// Index for supplier batch history
inventoryBatchSchema.index({ supplier: 1 });

// Index for depleted/low-stock queries
inventoryBatchSchema.index({ status: 1, quantity: 1 });

// ─── Virtual Getters ─────────────────────────────────────────────────────────

// Returns true if expiryDate < current date
inventoryBatchSchema.virtual('isExpired').get(function (this: IInventoryBatch) {
  if (!this.expiryDate) return false;
  return new Date(this.expiryDate).getTime() < Date.now();
});

// Returns profit margin percentage formatted to 2 decimal places
inventoryBatchSchema.virtual('profitMargin').get(function (this: IInventoryBatch) {
  if (!this.purchasePrice || this.purchasePrice === 0) return '0.00';
  return (((this.sellingPrice - this.purchasePrice) / this.purchasePrice) * 100).toFixed(2);
});

// Returns days until expiry date
inventoryBatchSchema.virtual('daysUntilExpiry').get(function (this: IInventoryBatch) {
  if (!this.expiryDate) return 0;
  const now = Date.now();
  const expiryTime = new Date(this.expiryDate).getTime();
  return Math.ceil((expiryTime - now) / (1000 * 60 * 60 * 24));
});

// ─── Pre-Save Middleware ──────────────────────────────────────────────────────

// Auto-set status to DEPLETED when quantity reaches 0 and status is ACTIVE
inventoryBatchSchema.pre('save', function (next) {
  if (this.quantity === 0 && this.status === BatchStatus.ACTIVE) {
    this.status = BatchStatus.DEPLETED;
  }
  next();
});

export default mongoose.model<IInventoryBatch>('InventoryBatch', inventoryBatchSchema);
