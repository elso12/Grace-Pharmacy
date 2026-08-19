import mongoose, { Document, Schema } from 'mongoose';

export enum ConsultStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface IConsultation extends Document {
  tenantId: mongoose.Types.ObjectId;
  patientId: mongoose.Types.ObjectId;
  pharmacistId: mongoose.Types.ObjectId;
  scheduledAt: Date;
  startedAt?: Date;
  endedAt?: Date;
  status: ConsultStatus;
  meetingLink?: string; // WebRTC or Zoom URL
  clinicalNotes?: {
    subjective?: string;
    objective?: string;
    assessment?: string;
    plan?: string;
  };
  chatTranscript?: {
    senderId: string;
    message: string;
    timestamp: Date;
  }[];
}

const ConsultationSchema: Schema = new Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    pharmacistId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    scheduledAt: { type: Date, required: true },
    startedAt: { type: Date },
    endedAt: { type: Date },
    status: { type: String, enum: Object.values(ConsultStatus), default: ConsultStatus.SCHEDULED },
    meetingLink: { type: String },
    clinicalNotes: {
      subjective: { type: String },
      objective: { type: String },
      assessment: { type: String },
      plan: { type: String },
    },
    chatTranscript: [
      {
        senderId: { type: String },
        message: { type: String },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model<IConsultation>('Consultation', ConsultationSchema);
