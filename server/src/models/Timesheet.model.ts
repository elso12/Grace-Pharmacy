import mongoose, { Document, Schema } from 'mongoose';

export enum TimesheetStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  APPROVED = 'APPROVED',
  PAID = 'PAID',
}

export interface ITimesheet extends Document {
  staffId: mongoose.Types.ObjectId;
  staffName: string;
  role: string;
  branchId?: mongoose.Types.ObjectId;
  clockIn: Date;
  clockOut?: Date;
  totalHours: number;
  hourlyRate: number;
  overtimeHours: number;
  status: TimesheetStatus;
  notes?: string;
}

const TimesheetSchema: Schema = new Schema(
  {
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    staffName: { type: String, required: true },
    role: { type: String, required: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
    clockIn: { type: Date, required: true },
    clockOut: { type: Date },
    totalHours: { type: Number, default: 0 },
    hourlyRate: { type: Number, default: 25.0 },
    overtimeHours: { type: Number, default: 0 },
    status: { type: String, enum: Object.values(TimesheetStatus), default: TimesheetStatus.ACTIVE },
    notes: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<ITimesheet>('Timesheet', TimesheetSchema);
