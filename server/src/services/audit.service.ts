import { Types } from 'mongoose';
import AuditLog, { AuditAction } from '../models/AuditLog.model';

interface AuditLogPayload {
  action: AuditAction;
  entityType: string;
  entityId: Types.ObjectId | string;
  performedBy?: Types.ObjectId | string;
  previousState?: any;
  newState?: any;
  ipAddress?: string;
}

/**
 * Logs a tamper-evident audit record to the database.
 */
export const logAudit = async (payload: AuditLogPayload): Promise<void> => {
  try {
    const auditRecord = new AuditLog({
      ...payload,
      entityId: typeof payload.entityId === 'string' ? new Types.ObjectId(payload.entityId) : payload.entityId,
      performedBy: payload.performedBy
        ? (typeof payload.performedBy === 'string' ? new Types.ObjectId(payload.performedBy) : payload.performedBy)
        : undefined,
    });
    
    await auditRecord.save();
  } catch (error) {
    console.error('[AuditService] Failed to write audit log:', error);
    // In a critical production system, failure to audit should perhaps throw and abort the transaction.
    // For this implementation, we log the error to stderr to ensure the core operation can still proceed.
  }
};
