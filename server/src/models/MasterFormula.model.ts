import mongoose, { Document, Schema } from 'mongoose';

export enum FormulationType {
  NON_STERILE_ORAL = 'NON_STERILE_ORAL',
  NON_STERILE_TOPICAL = 'NON_STERILE_TOPICAL',
  STERILE_IV = 'STERILE_IV',
  STERILE_OPHTHALMIC = 'STERILE_OPHTHALMIC',
}

export interface IMasterFormula extends Document {
  tenantId: mongoose.Types.ObjectId;
  name: string;
  type: FormulationType;
  ingredients: {
    productId: mongoose.Types.ObjectId; // Reference to raw API or Excipient in Inventory
    quantityRequired: number;
    unit: string;
  }[];
  instructions: string[];
  baseCost: number; // Sum of average chemical costs
  laborTimeMinutes: number;
  waterActivityAmount: number; // To calculate BUD (USP <795>)
  containsPreservative: boolean;
  isActive: boolean;
}

const MasterFormulaSchema: Schema = new Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    name: { type: String, required: true },
    type: { type: String, enum: Object.values(FormulationType), required: true },
    ingredients: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        quantityRequired: { type: Number, required: true },
        unit: { type: String, required: true },
      },
    ],
    instructions: [{ type: String }],
    baseCost: { type: Number, default: 0 },
    laborTimeMinutes: { type: Number, default: 15 },
    waterActivityAmount: { type: Number, default: 0 },
    containsPreservative: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<IMasterFormula>('MasterFormula', MasterFormulaSchema);
