import mongoose, { Schema, Document, Types, Model } from 'mongoose';

export interface IVendorReturn extends Document {
  rmaNumber: string;
  supplierId: Types.ObjectId;
  batchId: Types.ObjectId;
  quantityReturned: number;
  reason: 'EXPIRED' | 'DAMAGED' | 'RECALLED' | 'OVERSTOCK';
  creditStatus: 'PENDING_CREDIT' | 'CREDIT_ISSUED' | 'REPLACED';
  createdAt: Date;
  updatedAt: Date;
}

const vendorReturnSchema = new Schema<IVendorReturn>({
  rmaNumber: { type: String, required: true, unique: true },
  supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true },
  batchId: { type: Schema.Types.ObjectId, ref: 'InventoryBatch', required: true },
  quantityReturned: { type: Number, required: true, min: 1 },
  reason: { 
    type: String, 
    enum: ['EXPIRED', 'DAMAGED', 'RECALLED', 'OVERSTOCK'],
    required: true
  },
  creditStatus: { 
    type: String, 
    enum: ['PENDING_CREDIT', 'CREDIT_ISSUED', 'REPLACED'],
    default: 'PENDING_CREDIT'
  }
}, {
  timestamps: true
});

vendorReturnSchema.pre('validate', function (next) {
  if (!this.rmaNumber) {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.rmaNumber = `RMA-${timestamp}-${randomStr}`;
  }
  next();
});

vendorReturnSchema.index({ rmaNumber: 1 });
vendorReturnSchema.index({ supplierId: 1 });
vendorReturnSchema.index({ batchId: 1 });

const VendorReturn: Model<IVendorReturn> = mongoose.model<IVendorReturn>('VendorReturn', vendorReturnSchema);
export default VendorReturn;
