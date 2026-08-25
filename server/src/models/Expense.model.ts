import mongoose, { Schema, Document, Types, Model } from 'mongoose';

export interface IExpense extends Document {
  title: string;
  category: 'RENT' | 'PAYROLL' | 'UTILITIES' | 'LOGISTICS' | 'MARKETING' | 'OTHER';
  amount: number;
  date: Date;
  recordedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const expenseSchema = new Schema<IExpense>({
  title: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['RENT', 'PAYROLL', 'UTILITIES', 'LOGISTICS', 'MARKETING', 'OTHER'],
    required: true
  },
  amount: { type: Number, required: true, min: 0 },
  date: { type: Date, required: true },
  recordedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true
});

expenseSchema.index({ date: -1 });
expenseSchema.index({ category: 1 });

const Expense: Model<IExpense> = mongoose.model<IExpense>('Expense', expenseSchema);
export default Expense;
