import mongoose, { Document, Schema } from 'mongoose';

export enum LogActionType {
  RECEIPT = 'RECEIPT',
  DISPENSE = 'DISPENSE',
  RETURN = 'RETURN',
  WASTAGE = 'WASTAGE',
  INVENTORY_ADJUSTMENT = 'INVENTORY_ADJUSTMENT',
}

export interface IControlledSubstanceLog extends Document {
  tenantId: mongoose.Types.ObjectId;
  branchId: mongoose.Types.ObjectId;
  product: mongoose.Types.ObjectId;
  batch?: mongoose.Types.ObjectId;
  actionType: LogActionType;
  quantityChanged: number;
  runningBalance: number;
  performedBy: mongoose.Types.ObjectId;
  authorizedBy?: mongoose.Types.ObjectId; // Dual Auth PIN
  referenceId?: string; // e.g. Prescription ID, PO Number
  notes?: string;
  timestamp: Date;
}

const ControlledSubstanceLogSchema: Schema = new Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    batch: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryBatch' },
    actionType: { type: String, enum: Object.values(LogActionType), required: true },
    quantityChanged: { type: Number, required: true }, // Positive for receipts/returns, negative for dispense/wastage
    runningBalance: { type: Number, required: true, min: 0 },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    authorizedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    referenceId: { type: String },
    notes: { type: String },
    timestamp: { type: Date, default: Date.now, required: true, index: true },
  },
  { timestamps: true }
);

export default mongoose.model<IControlledSubstanceLog>('ControlledSubstanceLog', ControlledSubstanceLogSchema);
