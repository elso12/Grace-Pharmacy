import mongoose, { Schema, type Document, type Model, Types } from 'mongoose';

/**
 * Allergy sub-document interface
 */
export interface IAllergy {
  substance: string;
  severity: 'MILD' | 'MODERATE' | 'SEVERE';
  notes?: string;
}

/**
 * Customer / Patient document interface
 */
export interface ICustomer extends Document {
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  dateOfBirth?: Date;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  allergies: IAllergy[];
  medicalConditions: string[];
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  prescriptions: Types.ObjectId[];
  isActive: boolean;
  notes?: string;
  readonly fullName: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose Schema for Allergy sub-document
 */
const allergySchema = new Schema<IAllergy>(
  {
    substance: {
      type: String,
      required: [true, 'Substance is required'],
      trim: true,
    },
    severity: {
      type: String,
      enum: ['MILD', 'MODERATE', 'SEVERE'],
      required: [true, 'Severity is required'],
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

/**
 * Mongoose Schema for Customer / Patient
 */
const customerSchema = new Schema<ICustomer>(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ['MALE', 'FEMALE', 'OTHER'],
    },
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      zipCode: { type: String, trim: true },
    },
    allergies: {
      type: [allergySchema],
      default: [],
    },
    medicalConditions: {
      type: [String],
      default: [],
    },
    insuranceProvider: {
      type: String,
      trim: true,
    },
    insurancePolicyNumber: {
      type: String,
      trim: true,
    },
    prescriptions: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Prescription',
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual field for full name
customerSchema.virtual('fullName').get(function (this: ICustomer) {
  return `${this.firstName} ${this.lastName}`;
});

// Indexes
// Unique phone index as primary lookup method
customerSchema.index({ phone: 1 }, { unique: true });

// Sparse unique email index
// customerSchema.index({ email: 1 }, { unique: true, sparse: true });

// Alphabetical patient listing index
customerSchema.index({ lastName: 1, firstName: 1 });

// Text index for full-text search across first name, last name, and phone
customerSchema.index({ firstName: 'text', lastName: 'text', phone: 'text' });

const Customer: Model<ICustomer> = mongoose.model<ICustomer>('Customer', customerSchema);

export default Customer;
