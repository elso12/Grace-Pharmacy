import mongoose, { Schema, Document, Types } from 'mongoose';

export enum AlertPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum AlertStatus {
  UNRESOLVED = 'UNRESOLVED',
  RESOLVED = 'RESOLVED',
  DISMISSED = 'DISMISSED',
}

export enum AlertType {
  EXPIRING_BATCH = 'EXPIRING_BATCH',
  LOW_STOCK = 'LOW_STOCK',
  SYSTEM_ERROR = 'SYSTEM_ERROR',
}

export interface IAlert extends Document {
  type: AlertType;
  message: string;
  priority: AlertPriority;
  status: AlertStatus;
  referenceId?: Types.ObjectId; // E.g., InventoryBatch ID or Product ID
  createdAt: Date;
  updatedAt: Date;
}

const alertSchema = new Schema<IAlert>(
  {
    type: {
      type: String,
      enum: Object.values(AlertType),
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    priority: {
      type: String,
      enum: Object.values(AlertPriority),
      default: AlertPriority.MEDIUM,
    },
    status: {
      type: String,
      enum: Object.values(AlertStatus),
      default: AlertStatus.UNRESOLVED,
    },
    referenceId: {
      type: Schema.Types.ObjectId,
    },
  },
  {
    timestamps: true,
  }
);

alertSchema.index({ status: 1, createdAt: -1 });
alertSchema.index({ type: 1 });

export default mongoose.model<IAlert>('Alert', alertSchema);
