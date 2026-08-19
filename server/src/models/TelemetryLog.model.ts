import mongoose, { Document, Schema } from 'mongoose';

export enum SensorType {
  FRIDGE = 'FRIDGE',
  FREEZER = 'FREEZER',
  ROOM = 'ROOM',
}

export interface ITelemetryLog extends Document {
  tenantId: mongoose.Types.ObjectId;
  branchId: mongoose.Types.ObjectId;
  sensorId: string;
  sensorType: SensorType;
  temperature: number; // Celsius
  humidity: number; // Percentage
  timestamp: Date;
  isExcursion: boolean;
}

const TelemetryLogSchema: Schema = new Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
    sensorId: { type: String, required: true, index: true },
    sensorType: { type: String, enum: Object.values(SensorType), required: true },
    temperature: { type: Number, required: true },
    humidity: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now, index: true },
    isExcursion: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model<ITelemetryLog>('TelemetryLog', TelemetryLogSchema);
