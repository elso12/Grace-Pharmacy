/**
 * ─── Inventory Routes ─────────────────────────────────────────────────────
 * Maps HTTP endpoints to controller handlers with Zod validation middleware.
 *
 * Route structure:
 *   POST   /batches           → Add a new inventory batch
 *   GET    /fefo-dispense     → FEFO dispense plan (dry-run or commit)
 *   GET    /alerts/expiry     → Batches expiring within N days
 *   GET    /alerts/low-stock  → Products below reorder threshold
 *
 * All routes are mounted under /api/inventory in app.ts.
 */

import { Router } from "express";
import { validate } from "../middleware/validate";
import { authorizeRoles } from "../middleware/authMiddleware";
import { UserRole } from "../types/enums";
import {
  addBatchSchema,
  fefoDispenseSchema,
  expiryAlertSchema,
  lowStockAlertSchema,
} from "../validators/inventory.validators";
import {
  addBatch,
  fefoDispense,
  expiryAlerts,
  lowStockAlerts,
  quarantineBatch,
  submitCycleCount,
  getBatches,
} from "../controllers/inventory.controller";

const router = Router();

// ─── POST /api/inventory/batches ────────────────────────────────────────────
// Add a new batch with expiry date and stock level.
// Body validated against addBatchSchema (Zod).
router.post(
  "/batches",
  authorizeRoles(UserRole.ADMIN, UserRole.PHARMACIST),
  validate(addBatchSchema, "body"),
  addBatch
);

// ─── GET /api/inventory/batches ─────────────────────────────────────────────
router.get(
  "/batches",
  authorizeRoles(UserRole.ADMIN, UserRole.PHARMACIST, UserRole.TECHNICIAN),
  getBatches
);

// ─── GET /api/inventory/fefo-dispense?productId=X&quantity=Y ────────────────
// FEFO engine: calculates optimal batch deductions.
// Optional: &commit=true to actually deduct stock (atomic transaction).
// Query params validated + coerced by fefoDispenseSchema (Zod).
router.get(
  "/fefo-dispense",
  validate(fefoDispenseSchema, "query"),
  fefoDispense
);

// ─── GET /api/inventory/alerts/expiry?days=30 ───────────────────────────────
// Lists batches expiring within N days (default 30).
// Includes already-expired batches and urgency classification.
router.get(
  "/alerts/expiry",
  validate(expiryAlertSchema, "query"),
  expiryAlerts
);

// ─── GET /api/inventory/alerts/low-stock?threshold=N ────────────────────────
// Lists products below reorder threshold.
// Includes products with zero stock (no active batches).
router.get(
  "/alerts/low-stock",
  validate(lowStockAlertSchema, "query"),
  lowStockAlerts
);

// ─── PATCH /api/inventory/batches/:id/quarantine ────────────────────────────
// Quarantine a batch (e.g. damaged, recalled)
router.patch(
  "/batches/:id/quarantine",
  authorizeRoles(UserRole.ADMIN, UserRole.PHARMACIST),
  quarantineBatch
);

// ─── POST /api/inventory/count ──────────────────────────────────────────────
// Submit a physical inventory cycle count log for review.
router.post("/count", submitCycleCount);

export default router;
