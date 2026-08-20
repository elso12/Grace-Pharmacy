import mongoose, { Schema, type Document, type Model, Types } from 'mongoose';
import { UserRole } from '../types/enums';

export interface IUser extends Document {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  role: UserRole;
  phone?: string;
  licenseNumber?: string;
  isActive: boolean;
  tenantId?: Types.ObjectId;
  branchId?: Types.ObjectId;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  fullName: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
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
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters long'],
      select: false, // Prevents returning the password in queries by default
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.CUSTOMER,
    },
    phone: {
      type: String,
      trim: true,
    },
    licenseNumber: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
    },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
    },
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },
    lastLoginAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

import bcrypt from 'bcryptjs';

userSchema.virtual('fullName').get(function (this: IUser) {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.pre('save', async function (next) {
  // Only re-hash when the password field has actually changed.
  if (!this.isModified('password')) return next();

  // Guard: password must be a non-empty string before hashing.
  // TypeScript types it as `string | undefined`; this check both satisfies
  // the compiler and prevents a runtime error if the field is absent.
  if (!this.password) return next();

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  // Guard: if the password field wasn't selected in the query, return false
  // rather than passing `undefined` to bcrypt.compare (which would throw).
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password as string);
};

// userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ licenseNumber: 1 }, { sparse: true });

// We need to update the interface to include the method, but for now we can assert
const User = mongoose.model<IUser>('User', userSchema);

export default User;
