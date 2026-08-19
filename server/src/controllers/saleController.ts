import { Request, Response } from 'express';
import { asyncHandler } from '../utils/errors';
import { AppError } from '../utils/errors';
import Prescription from '../models/Prescription.model';
import { PrescriptionStatus } from '../types/enums';
// Reusing orderController's createOrder logic for the actual order creation
import { createOrder as baseCreateOrder } from './orderController';

/**
 * @desc    POS Checkout: Validates prescription status before proceeding to dispense
 * @route   POST /api/pos/checkout
 * @access  Private (CASHIER, PHARMACIST, ADMIN)
 */
export const posCheckout = asyncHandler(async (req: Request, res: Response, next) => {
  const { items, prescriptionId } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new AppError('Cart is empty', 400);
  }

  // 1. Clinical Validation: If a prescription ID is provided, verify its status
  if (prescriptionId) {
    const rx = await Prescription.findById(prescriptionId);
    if (!rx) {
      throw new AppError('Prescription not found', 404);
    }

    if (
      rx.status === PrescriptionStatus.IN_REVIEW ||
      rx.status === PrescriptionStatus.PENDING ||
      rx.status === PrescriptionStatus.REJECTED
    ) {
      throw new AppError('Cannot dispense: Prescription requires Pharmacist clinical review and approval.', 400);
    }
    
    // Check if it's already fulfilled
    if (rx.status === PrescriptionStatus.DISPENSED) {
      throw new AppError('Cannot dispense: Prescription has already been dispensed.', 400);
    }
  }

  // 2. Delegate to the actual order creation logic
  // orderController uses req.user, so we can just pass it through
  // If we want to mark it as POS, we can modify req.body.fulfillmentType = 'POS'
  req.body.fulfillmentType = 'POS';
  
  // Call baseCreateOrder
  return baseCreateOrder(req, res, next);
});
