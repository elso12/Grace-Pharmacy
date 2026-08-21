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

// ═════════════════════════════════════════════════════════════════════════════
// POST /api/prescriptions/:id/approve
// ═════════════════════════════════════════════════════════════════════════════
export const approvePrescription = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { clinicalNotes } = req.body;
  const pharmacist = (req as any).user;

  const prescription = await Prescription.findById(id);
  if (!prescription) {
    res.status(404).json({ status: "error", message: "Prescription not found" });
    return;
  }

  if (prescription.status === PrescriptionStatus.APPROVED) {
    res.status(400).json({ status: "error", message: "Prescription is already approved" });
    return;
  }

  // Generate digital signature
  const timestamp = new Date();
  const signatureStr = `Signed by ${pharmacist.firstName} ${pharmacist.lastName}, ${pharmacist.role} | ID# ${pharmacist.id} | Timestamp: ${timestamp.toISOString()}`;

  prescription.status = PrescriptionStatus.APPROVED;
  prescription.verificationDetails = {
    verifiedBy: pharmacist.id,
    verifiedAt: timestamp,
    digitalSignature: signatureStr,
    clinicalNotes: clinicalNotes || "",
  };

  await prescription.save();

  res.status(200).json({
    status: "success",
    message: "Prescription approved and digitally signed.",
    data: prescription,
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// POST /api/prescriptions/:id/reject
// ═════════════════════════════════════════════════════════════════════════════
export const rejectPrescription = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { rejectionReason, clinicalNotes } = req.body;
  const pharmacist = (req as any).user;

  if (!rejectionReason) {
    res.status(400).json({ status: "error", message: "Rejection reason is required." });
    return;
  }

  const prescription = await Prescription.findById(id);
  if (!prescription) {
    res.status(404).json({ status: "error", message: "Prescription not found" });
    return;
  }

  const timestamp = new Date();
  const signatureStr = `Rejected by ${pharmacist.firstName} ${pharmacist.lastName} | Timestamp: ${timestamp.toISOString()}`;

  prescription.status = PrescriptionStatus.REJECTED;
  prescription.verificationDetails = {
    verifiedBy: pharmacist.id,
    verifiedAt: timestamp,
    digitalSignature: signatureStr,
    clinicalNotes: clinicalNotes || "",
    rejectionReason: rejectionReason,
  };

  await prescription.save();

  res.status(200).json({
    status: "success",
    message: "Prescription rejected.",
    data: prescription,
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// GET /api/prescriptions/patients/:id/history
// ═════════════════════════════════════════════════════════════════════════════
import Customer from "../models/Customer.model";

export const getPatientHistory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const patient = await Customer.findById(id).select("-password");
  if (!patient) {
    res.status(404).json({ status: "error", message: "Patient not found" });
    return;
  }

  const prescriptions = await Prescription.find({ patient: id }).sort({ prescriptionDate: -1 });

  res.status(200).json({
    status: "success",
    data: {
      patient,
      prescriptions,
    },
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// POST /api/prescriptions/patients/:id/notes
// ═════════════════════════════════════════════════════════════════════════════
export const addConsultationNote = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { note } = req.body;
  const pharmacist = (req as any).user;

  if (!note) {
    res.status(400).json({ status: "error", message: "Consultation note is required." });
    return;
  }

  const patient = await Customer.findById(id);
  if (!patient) {
    res.status(404).json({ status: "error", message: "Patient not found" });
    return;
  }

  const timestamp = new Date().toISOString();
  const formattedNote = `\n--- [${timestamp}] by ${pharmacist.firstName} ${pharmacist.lastName} (${pharmacist.role}) ---\n${note}`;

  patient.notes = (patient.notes || "") + formattedNote;
  await patient.save();

  res.status(200).json({
    status: "success",
    message: "Consultation note added to patient history.",
    data: patient,
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// POST /api/prescriptions/upload
// ═════════════════════════════════════════════════════════════════════════════
export const uploadPrescription = asyncHandler(async (req: Request, res: Response) => {
  const { doctorName, medications, prescriptionImageUrl, documentUrl } = req.body;
  const user = await import("../models/User.model").then(m => m.default.findById((req as any).user.id));
  
  if (!user) {
    res.status(404).json({ status: "error", message: "User not found" });
    return;
  }

  const patient = await Customer.findOne({ $or: [{ email: user.email }, { phone: user.phone }] });
  if (!patient) {
    res.status(404).json({ status: "error", message: "Customer profile not found. Please update your profile first." });
    return;
  }

  // Create a pending prescription
  const prescription = await Prescription.create({
    tenantId: user.tenantId || "60d5ecb8b392d725409d5718", // placeholder tenant id if missing
    patient: patient._id,
    doctor: { name: doctorName || "Unknown" },
    medications: medications || [],
    prescriptionImageUrl,
    documentUrl,
    status: PrescriptionStatus.PENDING,
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year default expiry
    refillsRemaining: 0,
  });

  res.status(201).json({
    status: "success",
    message: "Prescription uploaded successfully",
    data: prescription,
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// POST /api/prescriptions/:id/refill
// ═════════════════════════════════════════════════════════════════════════════
import { Order } from "../models";
import { OrderStatus, FulfillmentType, PaymentMethod } from "../types/enums";

export const requestRefill = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const customerId = (req as any).user.id;

  const prescription = await Prescription.findById(id).populate('medications.product');
  if (!prescription) {
    res.status(404).json({ status: "error", message: "Prescription not found" });
    return;
  }

  if (prescription.refillsRemaining <= 0) {
    res.status(400).json({ status: "error", message: "No refills remaining on this prescription" });
    return;
  }

  if (prescription.expiryDate < new Date()) {
    res.status(400).json({ status: "error", message: "This prescription has expired" });
    return;
  }

  // Decrement refills
  prescription.refillsRemaining -= 1;
  await prescription.save();

  // Calculate items and cost for the order
  let totalAmount = 0;
  const orderItems = prescription.medications.map(med => {
    // Basic fallback price if product is not populated correctly
    const price = (med.product as any).price || 10; 
    totalAmount += price * med.quantity;
    return {
      medicationId: med.product._id || med.product,
      quantity: med.quantity,
      priceAtPurchase: price,
    };
  });

  // Create a pending order for the refill
  const order = await Order.create({
    customerId,
    items: orderItems,
    totalAmount,
    status: OrderStatus.PENDING,
    fulfillmentType: FulfillmentType.PICKUP,
    paymentMethod: PaymentMethod.CASH,
    prescriptionRequired: true,
    approvedByPharmacist: false, // Must be re-approved by Pharmacist or we can auto-approve based on logic. Let's require Pharmacist approval for refills.
  });

  res.status(201).json({
    status: "success",
    message: "Refill requested successfully",
    data: {
      prescription,
      order,
    }
  });
});
