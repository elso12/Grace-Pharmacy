/**
 * ─── Prescription Controller ──────────────────────────────────────────────
 * HTTP handlers for prescription management and clinical safety checking.
 */

import { type Request, type Response } from "express";
import { asyncHandler } from "../utils/errors";
import * as safetyCheckService from "../services/safetyCheck.service";
import type { SafetyCheckInput } from "../validators/prescription.validators";
import Prescription from "../models/Prescription.model";
import { PrescriptionStatus } from "../types/enums";

// ═════════════════════════════════════════════════════════════════════════════
// POST /api/prescriptions/safety-check
// ═════════════════════════════════════════════════════════════════════════════
/**
 * @desc    Evaluate a list of medications for drug-drug interactions and
 *          check against a patient's recorded allergies in MongoDB.
 * @route   POST /api/prescriptions/safety-check
 * @access  Private (ALL ROLES)
 */
export const safetyCheck = asyncHandler(async (req: Request, res: Response) => {
  // Body already validated & typed by Zod middleware
  const input = req.body as SafetyCheckInput;

  const result = await safetyCheckService.performSafetyCheck(input);

  // Return 200 OK regardless of clinical safety status (it's an analytical evaluation)
  // The frontend inspecting `result.isSafe` and `result.summary` will decide whether to block or warn.
  res.status(200).json({
    status: "success",
    message: result.isSafe
      ? "Safety check passed: No clinical interactions or allergy conflicts detected"
      : `Safety check alerted: Found ${result.summary.totalWarnings} potential clinical issue(s)`,
    data: result,
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// GET /api/prescriptions/my-prescriptions
// ═════════════════════════════════════════════════════════════════════════════
export const getMyPrescriptions = asyncHandler(async (req: Request, res: Response) => {
  const customerId = (req as any).user.id;
  const prescriptions = await Prescription.find({ patient: customerId })
    .sort({ prescriptionDate: -1 });

  res.status(200).json({
    status: "success",
    data: prescriptions,
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// GET /api/prescriptions/queue
// ═════════════════════════════════════════════════════════════════════════════
export const getPharmacistQueue = asyncHandler(async (req: Request, res: Response) => {
  const queue = await Prescription.find({
    status: { $in: [PrescriptionStatus.PENDING, PrescriptionStatus.IN_REVIEW] }
  })
    .sort({ prescriptionDate: -1 })
    .populate('patient', 'firstName lastName dateOfBirth'); // Populate basic patient info

  res.status(200).json({
    status: "success",
    data: queue,
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// PATCH /api/prescriptions/:id/status
// ═════════════════════════════════════════════════════════════════════════════
export const updatePrescriptionStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, notes } = req.body;

  const prescription = await Prescription.findByIdAndUpdate(
    id,
    { status, notes, updatedAt: new Date() },
    { new: true, runValidators: true }
  );

  if (!prescription) {
    res.status(404).json({ status: "error", message: "Prescription not found" });
    return;
  }

  res.status(200).json({
    status: "success",
    data: prescription,
  });
});
