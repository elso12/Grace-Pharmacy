import mongoose, { Document, Schema } from 'mongoose';

export interface ITenant extends Document {
  organizationName: string;
  contactEmail: string;
  contactPhone: string;
  isActive: boolean;
  subscriptionPlan: 'BASIC' | 'ENTERPRISE' | 'UNLIMITED';
  currency: string;
  taxPolicy: {
    rate: number; // e.g., 8.5 for 8.5%
    isIncludedInPrice: boolean;
  };
  branding?: {
    logoUrl?: string;
    primaryColor?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const TenantSchema: Schema = new Schema(
  {
    organizationName: { type: String, required: true, unique: true },
    contactEmail: { type: String, required: true },
    contactPhone: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    subscriptionPlan: {
      type: String,
      enum: ['BASIC', 'ENTERPRISE', 'UNLIMITED'],
      default: 'ENTERPRISE',
    },
    currency: { type: String, default: 'USD' },
    taxPolicy: {
      rate: { type: Number, default: 0 },
      isIncludedInPrice: { type: Boolean, default: false },
    },
    branding: {
      logoUrl: { type: String },
      primaryColor: { type: String },
    },
  },
  { timestamps: true }
);

export default mongoose.model<ITenant>('Tenant', TenantSchema);
