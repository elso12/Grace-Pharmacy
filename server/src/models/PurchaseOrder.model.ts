import mongoose, { Schema, Document, Types, Model } from 'mongoose';

export interface IPOItem {
  productId: Types.ObjectId;
  productName: string;
  requestedQuantity: number;
  unitCost: number;
  totalCost: number;
}

export interface IPOReceivedBatch {
  batchNumber: string;
  expiryDate: Date;
  quantityReceived: number;
  receivedAt: Date;
}

export enum POStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  SENT = 'SENT',
  PARTIALLY_RECEIVED = 'PARTIALLY_RECEIVED',
  FULFILLED = 'FULFILLED',
  CANCELLED = 'CANCELLED',
  ORDERED = 'ORDERED',
  RECEIVED_PARTIAL = 'RECEIVED_PARTIAL',
  RECEIVED_FULL = 'RECEIVED_FULL'
}

export interface IPurchaseOrder extends Document {
  poNumber: string;
  supplierId: Types.ObjectId;
  supplierName: string;
  items: IPOItem[];
  totalAmount: number;
  status: POStatus | string;
  generatedBy: Types.ObjectId;
  receivedBatches: IPOReceivedBatch[];
  createdAt: Date;
  updatedAt: Date;
}

const poItemSchema = new Schema<IPOItem>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  requestedQuantity: { type: Number, required: true, min: 1 },
  unitCost: { type: Number, required: true, min: 0 },
  totalCost: { type: Number, required: true, min: 0 }
}, { _id: false });

const poReceivedBatchSchema = new Schema<IPOReceivedBatch>({
  batchNumber: { type: String, required: true },
  expiryDate: { type: Date, required: true },
  quantityReceived: { type: Number, required: true, min: 1 },
  receivedAt: { type: Date, default: Date.now }
}, { _id: false });

const purchaseOrderSchema = new Schema<IPurchaseOrder>({
  poNumber: { type: String, required: true, unique: true },
  supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true },
  supplierName: { type: String, required: true },
  items: { type: [poItemSchema], required: true },
  totalAmount: { type: Number, required: true, min: 0 },
  status: { 
    type: String, 
    enum: ['DRAFT', 'ORDERED', 'RECEIVED_PARTIAL', 'RECEIVED_FULL', 'CANCELLED'],
    default: 'DRAFT'
  },
  generatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  receivedBatches: { type: [poReceivedBatchSchema], default: [] }
}, {
  timestamps: true
});

purchaseOrderSchema.pre('validate', function (next) {
  if (!this.poNumber) {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.poNumber = `PO-${timestamp}-${randomStr}`;
  }
  next();
});

purchaseOrderSchema.index({ poNumber: 1 });
purchaseOrderSchema.index({ status: 1 });
purchaseOrderSchema.index({ supplierId: 1 });

const PurchaseOrder: Model<IPurchaseOrder> = mongoose.model<IPurchaseOrder>('PurchaseOrder', purchaseOrderSchema);
export default PurchaseOrder;
