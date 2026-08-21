import { Request, Response, NextFunction } from 'express';
import { Order } from '../models/index';
import { OrderStatus, FulfillmentType } from '../types/enums';
import { AppError } from '../utils/errors';
import { calculateFefoDispense } from '../services/inventory.service';
import { Product } from '../models';

// ─── Create Order ────────────────────────────────────────────────────────
export const createOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { items, fulfillmentType, shippingAddress, paymentMethod, prescriptionId, prescriptionImageUrl } = req.body;
    // Assuming `req.user.id` is available from authentication middleware
    const customerId = (req as any).user.id;

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new AppError('Order must contain at least one item', 400);
    }

    if (fulfillmentType === FulfillmentType.DELIVERY && !shippingAddress) {
      throw new AppError('Shipping address is required for delivery', 400);
    }

    if (!paymentMethod) {
      throw new AppError('Payment method is required', 400);
    }

    let totalAmount = 0;
    const processedItems = [];
    let prescriptionRequired = false;

    // Verify stock and calculate total amount (Dry run)
    for (const item of items) {
      const { medicationId, quantity } = item;
      
      const fefoResult = await calculateFefoDispense({
        productId: medicationId,
        quantity
      }, false); // commit = false, dry run

      if (!fefoResult.canFulfill) {
        throw new AppError(`Insufficient stock for medication: ${fefoResult.productName}`, 400);
      }

      // Calculate average price per unit if multiple batches are used, or just use total cost
      // The requirement: "items: Array of objects containing medicationId, quantity, and priceAtPurchase"
      // We'll use the totalCost for this item line and divide by quantity to get priceAtPurchase per unit
      const priceAtPurchase = fefoResult.totalCost / quantity;

      // Check if product requires a prescription
      const productDoc = await Product.findById(medicationId).lean();
      if (productDoc && productDoc.requiresPrescription) {
        prescriptionRequired = true;
      }

      processedItems.push({
        medicationId,
        quantity,
        priceAtPurchase: Number(priceAtPurchase.toFixed(2))
      });

      totalAmount += fefoResult.totalCost;
    }

    if (prescriptionRequired && !prescriptionId && !prescriptionImageUrl) {
      throw new AppError('A prescription is required for one or more medications in your cart. Please upload a prescription.', 400);
    }

    const order = await Order.create({
      customerId,
      items: processedItems,
      totalAmount: Number(totalAmount.toFixed(2)),
      status: OrderStatus.PENDING,
      fulfillmentType,
      shippingAddress,
      paymentMethod,
      prescriptionRequired,
      approvedByPharmacist: false,
    });

    res.status(201).json({
      status: 'success',
      data: order,
    });
  } catch (error) {
    next(error);
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
