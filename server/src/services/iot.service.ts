import TelemetryLog, { SensorType } from '../models/TelemetryLog.model';
import InventoryBatch from '../models/InventoryBatch.model';
import { BatchStatus } from '../types/enums';

/**
 * Service to process incoming IoT Telemetry data and manage excursions.
 */

export interface TelemetryPayload {
  tenantId: string;
  branchId: string;
  sensorId: string;
  sensorType: SensorType;
  temperature: number;
  humidity: number;
}

const EXCURSION_LIMITS = {
  [SensorType.FRIDGE]: { min: 2.0, max: 8.0 },
  [SensorType.FREEZER]: { min: -25.0, max: -15.0 },
  [SensorType.ROOM]: { min: 15.0, max: 25.0 }
};

/**
 * Processes an incoming webhook from an IoT temperature sensor.
 */
export const processTelemetry = async (payload: TelemetryPayload) => {
  const limits = EXCURSION_LIMITS[payload.sensorType];
  const isExcursion = payload.temperature < limits.min || payload.temperature > limits.max;

  const log = new TelemetryLog({
    ...payload,
    isExcursion,
    timestamp: new Date()
  });

  await log.save();

  if (isExcursion) {
    await handleExcursionRule(payload);
  }

  return log;
};

/**
 * If a temperature breach is detected, check if it has been out of range for > 30 minutes.
 * If so, lock all drug batches linked to this sensor (fridge).
 */
const handleExcursionRule = async (payload: TelemetryPayload) => {
  const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
  
  // Find logs for this sensor in the last 30 minutes
  const recentLogs = await TelemetryLog.find({
    sensorId: payload.sensorId,
    timestamp: { $gte: thirtyMinsAgo }
  }).sort({ timestamp: -1 });

  // If we don't have 30 mins of continuous data, or if there's a normal reading, it might not be a sustained breach yet.
  // For safety, we'll check if ALL readings in the last 30 mins were excursions.
  const allExcursions = recentLogs.every(l => l.isExcursion);
  const timeSpanCovered = recentLogs.length > 0 && 
    (recentLogs[0].timestamp.getTime() - recentLogs[recentLogs.length - 1].timestamp.getTime() >= 25 * 60 * 1000); // approx 30 mins

  if (allExcursions && timeSpanCovered) {
    console.warn(`[IoT] Critical Temperature Excursion on Sensor ${payload.sensorId}! Locking batches.`);
    
    // In a real system, InventoryBatches would have a `storageLocation` or `sensorId` field mapping them to a fridge.
    // We mock the update here by quarantining batches associated with this branch that require cold chain.
    await InventoryBatch.updateMany(
      { 
        branchId: payload.branchId, 
        status: BatchStatus.ACTIVE 
        // AND requiresColdChain: true (Assuming a complex join or property here)
      },
      { 
        status: BatchStatus.QUARANTINED,
        notes: `Auto-Quarantined due to Cold-Chain breach on ${new Date().toISOString()}`
      }
    );
  }
};
