import mongoose, { Document, Schema } from 'mongoose';

export enum FormularyTier {
  TIER_1_GENERIC = 1,
  TIER_2_PREFERRED_BRAND = 2,
  TIER_3_NON_PREFERRED = 3,
  TIER_4_SPECIALTY = 4,
}

export interface IInsurancePlan extends Document {
  providerName: string;
  planName: string;
  binNumber: string;
  pcn: string;
  isActive: boolean;
  tierCopays: {
    [FormularyTier.TIER_1_GENERIC]: number;
    [FormularyTier.TIER_2_PREFERRED_BRAND]: number;
    [FormularyTier.TIER_3_NON_PREFERRED]: number;
    [FormularyTier.TIER_4_SPECIALTY]: number;
  };
  deductible: number;
}

const InsurancePlanSchema: Schema = new Schema(
  {
    providerName: { type: String, required: true },
    planName: { type: String, required: true },
    binNumber: { type: String, required: true, index: true }, // Bank Identification Number
    pcn: { type: String, required: true }, // Processor Control Number
    isActive: { type: Boolean, default: true },
    tierCopays: {
      1: { type: Number, required: true, min: 0 },
      2: { type: Number, required: true, min: 0 },
      3: { type: Number, required: true, min: 0 },
      4: { type: Number, required: true, min: 0 },
    },
    deductible: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<IInsurancePlan>('InsurancePlan', InsurancePlanSchema);
