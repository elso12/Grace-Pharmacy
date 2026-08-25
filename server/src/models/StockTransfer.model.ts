import mongoose, { Document, Schema } from 'mongoose';

export enum TransferStatus {
  REQUESTED = 'REQUESTED',
  APPROVED = 'APPROVED',
  IN_TRANSIT = 'IN_TRANSIT',
  RECEIVED = 'RECEIVED',
  CANCELLED = 'CANCELLED',
}

export interface IStockTransfer extends Document {
  transferNumber: string;
  fromBranchId: mongoose.Types.ObjectId;
  toBranchId: mongoose.Types.ObjectId;
  requestedBy: mongoose.Types.ObjectId;
  approvedBy?: mongoose.Types.ObjectId;
  receivedBy?: mongoose.Types.ObjectId;
  status: TransferStatus;
  items: {
    productId: mongoose.Types.ObjectId;
    productName: string;
    batchNumber?: string;
    quantity: number;
  }[];
  notes?: string;
  dispatchedAt?: Date;
  receivedAt?: Date;
}

const StockTransferSchema: Schema = new Schema(
  {
    transferNumber: { type: String, required: true, unique: true },
    fromBranchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
    toBranchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: Object.values(TransferStatus), default: TransferStatus.REQUESTED },
    items: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        productName: { type: String, required: true },
        batchNumber: { type: String },
        quantity: { type: Number, required: true, min: 1 },
      },
    ],
    notes: { type: String },
    dispatchedAt: { type: Date },
    receivedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model<IStockTransfer>('StockTransfer', StockTransferSchema);
