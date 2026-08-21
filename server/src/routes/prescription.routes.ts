/**
 * ─── Prescription Routes ──────────────────────────────────────────────────
 * Maps HTTP endpoints to prescription controller handlers with Zod validation.
 *
 * Route structure:
 *   POST   /safety-check   → Check drug-drug interactions and patient allergies
 */

import { Router } from "express";
import { validate } from "../middleware/validate";
import { safetyCheckSchema } from "../validators/prescription.validators";
import { 
  safetyCheck, 
  getPharmacistQueue, 
  updatePrescriptionStatus,
  getMyPrescriptions,
  approvePrescription,
  rejectPrescription,
  getPatientHistory,
  addConsultationNote
} from "../controllers/prescription.controller";
import { protect, authorizeRoles } from "../middleware/authMiddleware";
import { UserRole } from "../types/enums";

const router = Router();

// ─── POST /api/prescriptions/safety-check ───────────────────────────────────
// Input: Array of active medication names/RxCUIs + optional patientId.
// Logic: Checks NLM RxNav / Fallback drug interactions and MongoDB patient allergies.
router.post("/safety-check", protect, validate(safetyCheckSchema, "body"), safetyCheck);

// ─── GET /api/prescriptions/my-prescriptions ────────────────────────────────
router.get("/my-prescriptions", protect, authorizeRoles(UserRole.CUSTOMER), getMyPrescriptions);

// ─── GET /api/prescriptions/queue ───────────────────────────────────────────
router.get("/queue", protect, authorizeRoles(UserRole.ADMIN, UserRole.PHARMACIST), getPharmacistQueue);
router.get("/", protect, authorizeRoles(UserRole.ADMIN, UserRole.PHARMACIST), getPharmacistQueue);

// ─── PATCH /api/prescriptions/:id/status ────────────────────────────────────
router.patch("/:id/status", protect, authorizeRoles(UserRole.ADMIN, UserRole.PHARMACIST), updatePrescriptionStatus);

// ─── POST /api/prescriptions/:id/approve ────────────────────────────────────
router.post("/:id/approve", protect, authorizeRoles(UserRole.ADMIN, UserRole.PHARMACIST), approvePrescription);

// ─── POST /api/prescriptions/:id/reject ─────────────────────────────────────
router.post("/:id/reject", protect, authorizeRoles(UserRole.ADMIN, UserRole.PHARMACIST), rejectPrescription);

// ─── GET /api/prescriptions/patients/:id/history ────────────────────────────
router.get("/patients/:id/history", protect, authorizeRoles(UserRole.ADMIN, UserRole.PHARMACIST), getPatientHistory);

// ─── POST /api/prescriptions/patients/:id/notes ─────────────────────────────
router.post("/patients/:id/notes", protect, authorizeRoles(UserRole.ADMIN, UserRole.PHARMACIST), addConsultationNote);

export default router;
