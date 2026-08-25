import mongoose, { Document, Schema } from 'mongoose';

export enum BranchType {
  HEADQUARTERS = 'HEADQUARTERS',
  WAREHOUSE = 'WAREHOUSE',
  RETAIL = 'RETAIL',
  SATELLITE_CLINIC = 'SATELLITE_CLINIC',
}

export interface IBranch extends Document {
  tenantId: mongoose.Types.ObjectId;
  name: string;
  code: string;
  type: BranchType;
  address: string;
  phone: string;
  isActive: boolean;
  managerId?: mongoose.Types.ObjectId;
}

const BranchSchema: Schema = new Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    type: {
      type: String,
      enum: Object.values(BranchType),
      required: true,
    },
    address: { type: String, required: true },
    phone: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model<IBranch>('Branch', BranchSchema);
