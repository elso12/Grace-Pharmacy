import mongoose, { Schema, type Document, type Model, Types } from 'mongoose';
import { OrderStatus, FulfillmentType, OrderPaymentStatus, PaymentMethod } from '../types/enums';

export interface IOrderItem {
  medicationId: Types.ObjectId;
  quantity: number;
  priceAtPurchase: number;
}

export interface IShippingAddress {
  street: string;
  city: string;
  zip: string;
}

export interface IOrder extends Document {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  branchId: Types.ObjectId;
  customerId: Types.ObjectId;
  items: IOrderItem[];
  totalAmount: number;
  status: OrderStatus;
  fulfillmentType: FulfillmentType;
  shippingAddress?: IShippingAddress;
  paymentMethod: PaymentMethod;
  paymentStatus: OrderPaymentStatus;
  walletProvider?: 'TELEBIRR' | 'CBE_BIRR' | 'BOA' | 'AWASH_BIRR' | 'OTHER' | null;
  walletPhone?: string | null;
  transactionReference?: string | null;
  prescriptionRequired: boolean;
  approvedByPharmacist: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    medicationId: {
      type: Schema.Types.ObjectId,
      ref: 'Product', // Assuming medications refer to Product model
      required: [true, 'Medication ID is required'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    priceAtPurchase: {
      type: Number,
      required: [true, 'Price at purchase is required'],
      min: [0, 'Price cannot be negative'],
    },
  },
  { _id: false }
);

const shippingAddressSchema = new Schema<IShippingAddress>(
  {
    street: { type: String, required: true },
    city: { type: String, required: true },
    zip: { type: String, required: true },
  },
  { _id: false }
);

const orderSchema = new Schema<IOrder>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
    },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Customer ID is required'],
    },
    items: {
      type: [orderItemSchema],
      validate: [
        (v: IOrderItem[]) => v.length > 0,
        'An order must have at least one item',
      ],
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount cannot be negative'],
    },
    status: {
      type: String,
      enum: Object.values(OrderStatus),
      default: OrderStatus.PENDING,
    },
    fulfillmentType: {
      type: String,
      enum: Object.values(FulfillmentType),
      required: [true, 'Fulfillment type is required'],
    },
    shippingAddress: {
      type: shippingAddressSchema,
      required: function (this: IOrder) {
        return this.fulfillmentType === FulfillmentType.DELIVERY;
      },
    },
    paymentMethod: {
      type: String,
      enum: Object.values(PaymentMethod),
      required: [true, 'Payment method is required'],
    },
    paymentStatus: {
      type: String,
      enum: Object.values(OrderPaymentStatus),
      default: OrderPaymentStatus.UNPAID,
    },
    walletProvider: {
      type: String,
      enum: ['TELEBIRR', 'CBE_BIRR', 'BOA', 'AWASH_BIRR', 'OTHER', null],
      default: null,
    },
    walletPhone: {
      type: String,
      default: null,
    },
    transactionReference: {
      type: String,
      default: null,
    },
    prescriptionRequired: {
      type: Boolean,
      default: false,
    },
    approvedByPharmacist: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index: "all orders for customer X, newest first" in a single index scan
orderSchema.index({ customerId: 1, createdAt: -1 });
orderSchema.index({ status: 1 });

const Order: Model<IOrder> = mongoose.model<IOrder>('Order', orderSchema);

export default Order;
