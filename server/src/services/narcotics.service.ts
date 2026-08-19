import User from '../models/User.model';
import ControlledSubstanceLog, { LogActionType } from '../models/ControlledSubstanceLog.model';
import mongoose from 'mongoose';

/**
 * Service handling strict dual-authorization and perpetual logging for Controlled Substances (Schedule II-V).
 */

export const verifySupervisorPin = async (supervisorId: string, pin: string): Promise<boolean> => {
  // In a real application, users would have a dedicated secure PIN field, hashed with bcrypt.
  // We simulate the validation here.
  const supervisor = await User.findById(supervisorId);
  if (!supervisor) return false;
  
  // For simulation purposes, accept '1234' as valid PIN for anyone with PHARMACIST or ADMIN role
  if (['PHARMACIST', 'ADMIN'].includes(supervisor.role) && pin === '1234') {
    return true;
  }
  
  return false;
};

export interface LogEntryParams {
  branchId: mongoose.Types.ObjectId;
  product: mongoose.Types.ObjectId;
  batch?: mongoose.Types.ObjectId;
  actionType: LogActionType;
  quantityChanged: number;
  performedBy: mongoose.Types.ObjectId;
  authorizedBy?: mongoose.Types.ObjectId; // Must be present if dispensing Schedule II
  referenceId?: string;
  notes?: string;
}

/**
 * Logs a controlled substance transaction and calculates the new perpetual balance.
 * Enforces dual-authorization for highly restrictive actions.
 */
export const logControlledTransaction = async (params: LogEntryParams, isScheduleII: boolean = false) => {
  
  if (isScheduleII && params.actionType === LogActionType.DISPENSE && !params.authorizedBy) {
    throw new Error("Dual-authorization required to dispense Schedule II Narcotics.");
  }

  // Find the last running balance for this product at this branch
  const lastLog = await ControlledSubstanceLog.findOne({
    branchId: params.branchId,
    product: params.product
  }).sort({ timestamp: -1 });

  const previousBalance = lastLog ? lastLog.runningBalance : 0;
  const newBalance = previousBalance + params.quantityChanged;

  if (newBalance < 0) {
    throw new Error("Critical Error: Controlled substance running balance cannot fall below zero.");
  }

  const newLog = new ControlledSubstanceLog({
    ...params,
    runningBalance: newBalance,
    timestamp: new Date()
  });

  await newLog.save();
  return newLog;
};

/**
 * Generates an export string simulating a DEA Form 222 or similar regulatory ledger.
 */
export const generateRegulatoryExport = async (branchId: string, startDate: Date, endDate: Date) => {
  const logs = await ControlledSubstanceLog.find({
    branchId,
    timestamp: { $gte: startDate, $lte: endDate }
  })
  .populate('product', 'name genericName')
  .populate('performedBy', 'fullName licenseNumber')
  .populate('authorizedBy', 'fullName licenseNumber')
  .sort({ timestamp: 1 });

  // Format as CSV
  let csv = "Timestamp,Action,Product,Quantity Changed,Running Balance,Performed By,License #,Authorized By,Auth License #,Ref ID,Notes\n";
  
  logs.forEach(log => {
    const p = log.product as any;
    const performed = log.performedBy as any;
    const auth = log.authorizedBy as any;
    
    csv += `"${log.timestamp.toISOString()}","${log.actionType}","${p?.name || 'Unknown'}","${log.quantityChanged}","${log.runningBalance}","${performed?.fullName || ''}","${performed?.licenseNumber || ''}","${auth?.fullName || ''}","${auth?.licenseNumber || ''}","${log.referenceId || ''}","${log.notes || ''}"\n`;
  });

  return csv;
};
