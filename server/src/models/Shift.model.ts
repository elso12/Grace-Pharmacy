import mongoose, { Document, Schema } from 'mongoose';

export enum ShiftStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}

export interface IShift extends Document {
  tenantId: mongoose.Types.ObjectId;
  branchId: mongoose.Types.ObjectId;
  cashierId: mongoose.Types.ObjectId;
  openedAt: Date;
  closedAt?: Date;
  status: ShiftStatus;
  openingFloat: number;
  expectedCash: number;
  actualCash?: number;
  cashVariance?: number;
  totalSales: number;
  totalReturns: number;
  paidIns: number;
  paidOuts: number;
  notes?: string;
}

const ShiftSchema: Schema = new Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
    cashierId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    openedAt: { type: Date, default: Date.now, required: true },
    closedAt: { type: Date },
    status: { type: String, enum: Object.values(ShiftStatus), default: ShiftStatus.OPEN },
    openingFloat: { type: Number, required: true, min: 0 },
    expectedCash: { type: Number, required: true, min: 0 },
    actualCash: { type: Number, min: 0 },
    cashVariance: { type: Number }, // Positive for overage, negative for shortage
    totalSales: { type: Number, default: 0 },
    totalReturns: { type: Number, default: 0 },
    paidIns: { type: Number, default: 0 },
    paidOuts: { type: Number, default: 0 },
    notes: { type: String },
  },
  { timestamps: true }
);

// Method to safely close shift and calculate variance
ShiftSchema.methods.closeShift = function (actualCash: number, notes?: string) {
  this.actualCash = actualCash;
  this.cashVariance = actualCash - this.expectedCash;
  this.status = ShiftStatus.CLOSED;
  this.closedAt = new Date();
  if (notes) this.notes = notes;
  return this.save();
};

export default mongoose.model<IShift>('Shift', ShiftSchema);
