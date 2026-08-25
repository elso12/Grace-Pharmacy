import { Request, Response, NextFunction } from 'express';
import { Order } from '../models/index';
import { OrderStatus, FulfillmentType, PaymentMethod, OrderPaymentStatus } from '../types/enums';
import { AppError } from '../utils/errors';
import { calculateFefoDispense } from '../services/inventory.service';
import { Product, User } from '../models';
import mongoose from 'mongoose';

// ─── Create Order ────────────────────────────────────────────────────────
export const createOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const {
      items,
      fulfillmentType,
      deliveryAddress,
      deliveryPhone,
      paymentMethod,
      paymentDetails,
      prescriptionImageUrl,
      notes,
    } = req.body;

    // 1. Calculate Subtotal & Tax
    let subtotal = 0;
    let rxRequired = false;

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        res.status(400).json({ success: false, message: `Product not found: ${item.name || item.productId}` });
        return;
      }
      if (product.requiresPrescription) rxRequired = true;
      subtotal += product.unitPrice * item.quantity;
    }

    let mappedPaymentMethod = PaymentMethod.CASH;
    if (paymentMethod === 'CARD') mappedPaymentMethod = PaymentMethod.CREDIT_CARD;
    if (paymentMethod === 'MOBILE_WALLET') mappedPaymentMethod = PaymentMethod.MOBILE_PAYMENT;
    if (paymentMethod === 'INSURANCE') mappedPaymentMethod = PaymentMethod.INSURANCE;

    let mappedFulfillmentType = FulfillmentType.PICKUP;
    if (fulfillmentType === 'HOME_DELIVERY') mappedFulfillmentType = FulfillmentType.DELIVERY;

    const tax = Math.round(subtotal * 0.08 * 100) / 100; // 8% Tax
    const deliveryFee = mappedFulfillmentType === FulfillmentType.DELIVERY ? 5.00 : 0.00;
    const totalAmount = Math.round((subtotal + tax + deliveryFee) * 100) / 100;

    // 2. Determine Initial Order & Payment Status
    let paymentStatus = OrderPaymentStatus.UNPAID;

    if (paymentMethod === 'CARD') {
      paymentStatus = OrderPaymentStatus.PAID;
    } else if (paymentMethod === 'MOBILE_WALLET') {
      paymentStatus = OrderPaymentStatus.PAID;
    }

    const initialOrderStatus = rxRequired ? OrderStatus.PENDING : OrderStatus.PENDING;

    // We need tenantId and branchId as required by the schema. Using mock ObjectIds for now.
    const tenantId = new mongoose.Types.ObjectId();
    const branchId = new mongoose.Types.ObjectId();

    // 3. Create Order in MongoDB
    const order = await Order.create({
      tenantId,
      branchId,
      customerId: user._id,
      items: items.map((i: any) => ({
        medicationId: i.productId,
        quantity: i.quantity,
        priceAtPurchase: i.unitPrice, 
      })),
      totalAmount,
      fulfillmentType: mappedFulfillmentType,
      shippingAddress: mappedFulfillmentType === FulfillmentType.DELIVERY ? { street: deliveryAddress || 'N/A', city: 'Local', zip: '00000' } : undefined,
      paymentMethod: mappedPaymentMethod,
      paymentStatus,
      prescriptionRequired: rxRequired,
      approvedByPharmacist: !rxRequired,
      status: initialOrderStatus,
    });

    // 4. Award Loyalty Points (1 point per $1 spent)
    if (user.role === 'CUSTOMER') {
      await User.findByIdAndUpdate(user._id, {
        $inc: { loyaltyPoints: Math.floor(totalAmount) },
      });
    }

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: order,
    });
  } catch (error: any) {
    console.error('Order creation error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to process order' });
  }
};

// ─── Get Customer Orders ──────────────────────────────────────────────────
export const getCustomerOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const customerId = (req as any).user.id;

    const orders = await Order.find({ customerId })
      .sort({ createdAt: -1 })
      .populate('items.medicationId', 'name genericName sku');

    res.status(200).json({
      status: 'success',
      results: orders.length,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get Order By ID ──────────────────────────────────────────────────
export const getOrderById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const customerId = (req as any).user.id;
    const { id } = req.params;

    const order = await Order.findOne({ _id: id, customerId })
      .populate('items.medicationId', 'name genericName sku requiresPrescription');

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    res.status(200).json({
      status: 'success',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get All Orders (Admin) ──────────────────────────────────────────────────
export const getAllOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .populate('items.medicationId', 'name genericName sku')
      .populate('customerId', 'firstName lastName email');

    res.status(200).json({
      status: 'success',
      results: orders.length,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get Pending Prescription Orders ─────────────────────────────────────────
export const getPendingPrescriptionOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const orders = await Order.find({
      prescriptionRequired: true,
      approvedByPharmacist: false,
      status: OrderStatus.PENDING
    })
      .sort({ createdAt: 1 })
      .populate('items.medicationId', 'name genericName sku requiresPrescription')
      .populate('customerId', 'firstName lastName email');

    res.status(200).json({
      status: 'success',
      results: orders.length,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get Ready-to-Pack Orders (Technician) ───────────────────────────────
export const getReadyToPackOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const orders = await Order.find({
      status: OrderStatus.PENDING,
      $or: [
        { prescriptionRequired: false },
        { approvedByPharmacist: true }
      ]
    })
      .sort({ createdAt: 1 })
      .populate('items.medicationId', 'name genericName sku requiresPrescription shelfLocation')
      .populate('customerId', 'firstName lastName email');

    res.status(200).json({
      status: 'success',
      results: orders.length,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Update Order Status ────────────────────────────────────────────────
export const updateOrderStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await Order.findById(id);

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    // Block status change if prescription required and not approved
    const fulfillmentStatuses = [
      OrderStatus.PROCESSING,
      OrderStatus.PACKED,
      OrderStatus.READY_FOR_PICKUP,
      OrderStatus.OUT_FOR_DELIVERY,
      OrderStatus.COMPLETED,
    ];

    if (
      fulfillmentStatuses.includes(status) &&
      order.prescriptionRequired &&
      !order.approvedByPharmacist
    ) {
      throw new AppError(
        'This order contains prescription-only medications and must be approved by a Pharmacist before fulfillment.',
        403
      );
    }

    // Enforce role constraints for TECHNICIAN
    if (req.user?.role === 'TECHNICIAN') {
      if (![OrderStatus.PACKED, OrderStatus.READY_FOR_PICKUP].includes(status)) {
        throw new AppError('Technicians can only update orders to PACKED or READY_FOR_PICKUP', 403);
      }
    }

    // Trigger FEFO inventory deduction if status transitions to PROCESSING, PACKED, or READY_FOR_PICKUP
    // from a PENDING state to ensure we only deduct once.
    if (
      (status === OrderStatus.PROCESSING || status === OrderStatus.PACKED || status === OrderStatus.READY_FOR_PICKUP) &&
      order.status === OrderStatus.PENDING
    ) {
      // Execute the deduction for each item
      for (const item of order.items) {
        const fefoResult = await calculateFefoDispense({
          productId: item.medicationId.toString(),
          quantity: item.quantity
        }, true); // commit = true

        if (!fefoResult.canFulfill) {
          throw new AppError(`Cannot fulfill order. Insufficient stock for medication: ${fefoResult.productName}`, 400);
        }
      }
    }

    order.status = status;
    await order.save();

    // CRM: Award Loyalty Points if order is completed
    if (status === OrderStatus.COMPLETED) {
      const User = require('../models/User.model').default;
      const customer = await User.findById(order.customerId);
      if (customer) {
        // 1 point per $1 spent
        const pointsToAward = Math.floor(order.totalAmount);
        customer.loyaltyPoints = (customer.loyaltyPoints || 0) + pointsToAward;
        await customer.save();
      }
    }

    res.status(200).json({
      status: 'success',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Approve Prescription Order ─────────────────────────────────────────
export const approvePrescriptionOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id);

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (!order.prescriptionRequired) {
      throw new AppError('This order does not require prescription approval', 400);
    }

    if (order.approvedByPharmacist) {
      throw new AppError('Order is already approved', 400);
    }

    order.approvedByPharmacist = true;
    await order.save();

    res.status(200).json({
      status: 'success',
      message: 'Prescription order approved successfully',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};
