import mongoose, { Schema, type Document, Types } from 'mongoose';
import { CycleCountStatus } from '../types/enums';

export interface ICycleCount extends Document {
  tenantId: Types.ObjectId;
  batchId: Types.ObjectId;
  expectedQuantity: number;
  actualQuantity: number;
  countedBy: Types.ObjectId;
  status: CycleCountStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const cycleCountSchema = new Schema<ICycleCount>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
    },
    batchId: {
      type: Schema.Types.ObjectId,
      ref: 'InventoryBatch',
      required: true,
    },
    expectedQuantity: {
      type: Number,
      required: true,
    },
    actualQuantity: {
      type: Number,
      required: true,
    },
    countedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(CycleCountStatus),
      default: CycleCountStatus.PENDING_REVIEW,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const CycleCount = mongoose.model<ICycleCount>('CycleCount', cycleCountSchema);
