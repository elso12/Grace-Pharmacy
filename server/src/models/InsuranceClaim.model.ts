import mongoose, { Schema, Document, Types, Model } from 'mongoose';

export interface IInsuranceClaim extends Document {
  claimNumber: string;
  orderId?: Types.ObjectId;
  prescriptionId?: Types.ObjectId;
  patientId: Types.ObjectId;
  patientName: string;
  insuranceProvider: string;
  policyNumber: string;
  groupNumber?: string;
  totalBilledAmount: number;
  patientCopayAmount: number;
  insuranceCoveredAmount: number;
  status: 'SUBMITTED' | 'PENDING_ADJUDICATION' | 'APPROVED_PAID' | 'PARTIALLY_PAID' | 'REJECTED';
  rejectionReason?: string;
  adjudicatedAt?: Date;
  remittanceCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

const insuranceClaimSchema = new Schema<IInsuranceClaim>({
  claimNumber: { type: String, required: true, unique: true },
  orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
  prescriptionId: { type: Schema.Types.ObjectId, ref: 'Prescription' },
  patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  patientName: { type: String, required: true },
  insuranceProvider: { type: String, required: true },
  policyNumber: { type: String, required: true },
  groupNumber: { type: String },
  totalBilledAmount: { type: Number, required: true, min: 0 },
  patientCopayAmount: { type: Number, required: true, min: 0 },
  insuranceCoveredAmount: { type: Number, required: true, min: 0 },
  status: { 
    type: String, 
    enum: ['SUBMITTED', 'PENDING_ADJUDICATION', 'APPROVED_PAID', 'PARTIALLY_PAID', 'REJECTED'],
    default: 'PENDING_ADJUDICATION'
  },
  rejectionReason: { type: String },
  adjudicatedAt: { type: Date },
  remittanceCode: { type: String }
}, {
  timestamps: true
});

insuranceClaimSchema.index({ claimNumber: 1 });
insuranceClaimSchema.index({ status: 1 });
insuranceClaimSchema.index({ insuranceProvider: 1 });
insuranceClaimSchema.index({ patientId: 1 });

const InsuranceClaim: Model<IInsuranceClaim> = mongoose.model<IInsuranceClaim>('InsuranceClaim', insuranceClaimSchema);
export default InsuranceClaim;
