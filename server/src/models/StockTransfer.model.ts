import mongoose, { Document, Schema } from 'mongoose';

export enum TransferStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  IN_TRANSIT = 'IN_TRANSIT',
  RECEIVED = 'RECEIVED',
  CANCELLED = 'CANCELLED',
}

export interface IStockTransfer extends Document {
  sourceBranch: mongoose.Types.ObjectId;
  destinationBranch: mongoose.Types.ObjectId;
  requestedBy: mongoose.Types.ObjectId;
  approvedBy?: mongoose.Types.ObjectId;
  status: TransferStatus;
  items: {
    product: mongoose.Types.ObjectId;
    batch?: mongoose.Types.ObjectId; // Specified when dispatched
    quantity: number;
  }[];
  notes?: string;
  dispatchedAt?: Date;
  receivedAt?: Date;
}

const StockTransferSchema: Schema = new Schema(
  {
    sourceBranch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
    destinationBranch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: Object.values(TransferStatus), default: TransferStatus.PENDING },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        batch: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryBatch' },
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
