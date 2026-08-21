import mongoose, { Schema, type Document, type Model, Types } from 'mongoose';
import { PrescriptionStatus } from '../types/enums';

/**
 * Doctor / Prescriber information sub-document interface
 */
export interface IDoctorInfo {
  name: string;
  phone?: string;
  licenseNumber?: string;
  clinic?: string;
}

/**
 * Individual item/medication within a prescription
 */
export interface IPrescriptionItem {
  product: Types.ObjectId;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  dispensedQuantity: number;
  notes?: string;
}

export interface IVerificationDetails {
  verifiedBy?: Types.ObjectId;
  verifiedAt?: Date;
  digitalSignature?: string;
  clinicalNotes?: string;
  rejectionReason?: string;
}

/**
 * Prescription document interface
 */
export interface IPrescription extends Document {
  tenantId: Types.ObjectId;
  patient: Types.ObjectId;
  prescriptionNumber: string;
  doctor: IDoctorInfo;
  medications: IPrescriptionItem[];
  status: PrescriptionStatus;
  prescriptionDate: Date;
  expiryDate: Date;
  dispensedBy?: Types.ObjectId;
  dispensedAt?: Date;
  notes?: string;
  prescriptionImageUrl?: string;
  documentUrl?: string;
  verificationDetails?: IVerificationDetails;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose Schema for Doctor Info sub-document
 */
const doctorInfoSchema = new Schema<IDoctorInfo>(
  {
    name: {
      type: String,
      required: [true, 'Doctor name is required'],
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    licenseNumber: {
      type: String,
      trim: true,
    },
    clinic: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

/**
 * Mongoose Schema for Prescription Item sub-document
 */
const prescriptionItemSchema = new Schema<IPrescriptionItem>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product reference is required'],
    },
    dosage: {
      type: String,
      required: [true, 'Dosage is required'],
      trim: true,
    },
    frequency: {
      type: String,
      required: [true, 'Frequency is required'],
      trim: true,
    },
    duration: {
      type: String,
      required: [true, 'Duration is required'],
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    dispensedQuantity: {
      type: Number,
      default: 0,
      min: [0, 'Dispensed quantity cannot be negative'],
    },
    notes: {
      type: String,
      trim: true,
    },
  }
);

/**
 * Mongoose Schema for Prescription
 */
const prescriptionSchema = new Schema<IPrescription>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
    },
    patient: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Patient reference is required'],
    },
    prescriptionNumber: {
      type: String,
      required: [true, 'Prescription number is required'],
      unique: true,
      trim: true,
    },
    doctor: {
      type: doctorInfoSchema,
      required: [true, 'Doctor information is required'],
    },
    medications: {
      type: [prescriptionItemSchema],
      required: [true, 'Medications are required'],
      validate: [
        {
          validator: (val: IPrescriptionItem[]) => Array.isArray(val) && val.length > 0,
          message: 'Prescription must contain at least one medication',
        },
      ],
    },
    status: {
      type: String,
      enum: Object.values(PrescriptionStatus),
      default: PrescriptionStatus.PENDING,
      required: [true, 'Status is required'],
    },
    prescriptionDate: {
      type: Date,
      required: [true, 'Prescription date is required'],
      default: Date.now,
    },
    expiryDate: {
      type: Date,
      required: [true, 'Expiry date is required'],
    },
    dispensedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    dispensedAt: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
    },
    prescriptionImageUrl: {
      type: String,
      trim: true,
    },
    documentUrl: {
      type: String,
      trim: true,
    },
    verificationDetails: {
      verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      verifiedAt: { type: Date },
      digitalSignature: { type: String, trim: true },
      clinicalNotes: { type: String, trim: true },
      rejectionReason: { type: String, trim: true },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Pre-validate hook: auto-generate unique prescription number if not set
prescriptionSchema.pre('validate', function (next) {
  if (!this.prescriptionNumber) {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.prescriptionNumber = `RX-${timestamp}-${randomStr}`;
  }
  next();
});

// Strategic Compound & Field Indexes
// 1. Unique index on prescription number for fast lookup
// prescriptionSchema.index({ prescriptionNumber: 1 }, { unique: true });

// 2. Patient prescription history filtered by status
prescriptionSchema.index({ patient: 1, status: 1 });

// 3. Pharmacy queue (pending prescriptions sorted newest first)
prescriptionSchema.index({ status: 1, prescriptionDate: -1 });

// 4. Expiry monitoring
prescriptionSchema.index({ expiryDate: 1, status: 1 });

// 5. Pharmacist activity logs
prescriptionSchema.index({ dispensedBy: 1, dispensedAt: -1 });

const Prescription: Model<IPrescription> = mongoose.model<IPrescription>('Prescription', prescriptionSchema);

export default Prescription;
