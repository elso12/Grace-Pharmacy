import mongoose, { Schema, Document, Types } from 'mongoose';

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  DISPENSE = 'DISPENSE',
  PRICE_CHANGE = 'PRICE_CHANGE',
  USER_CREATED = 'USER_CREATED',
  ROLE_CHANGED = 'ROLE_CHANGED',
  STOCK_ADJUSTMENT = 'STOCK_ADJUSTMENT',
  ORDER_CANCELLED = 'ORDER_CANCELLED',
}

export interface IAuditLog extends Document {
  actorId?: Types.ObjectId;
  actorName: string;
  actorRole: string;
  action: string;
  targetEntity: string;
  details?: any;
  ipAddress?: string;
  timestamp: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    actorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    actorName: {
      type: String,
      required: true,
    },
    actorRole: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    targetEntity: {
      type: String,
      required: true,
      index: true,
    },
    details: {
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
    timestamps: false,
  }
);

export default mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
