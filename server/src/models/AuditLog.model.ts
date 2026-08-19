import mongoose, { Schema, Document, Types } from 'mongoose';

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  DISPENSE = 'DISPENSE',
  PRICE_CHANGE = 'PRICE_CHANGE',
}

export interface IAuditLog extends Document {
  action: AuditAction;
  entityType: string;
  entityId: Types.ObjectId;
  performedBy?: Types.ObjectId;
  previousState?: any;
  newState?: any;
  ipAddress?: string;
  timestamp: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    action: {
      type: String,
      enum: Object.values(AuditAction),
      required: true,
    },
    entityType: {
      type: String,
      required: true,
      index: true,
    },
    entityId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    previousState: {
      type: Schema.Types.Mixed,
    },
    newState: {
      type: Schema.Types.Mixed,
    },
    ipAddress: {
      type: String,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    // Capped collections or time-series could be used here for true immutability,
    // but a standard collection with no update/delete routes serves as a basic audit log.
    timestamps: false, // We use timestamp manually
  }
);

export default mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
