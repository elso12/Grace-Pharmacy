/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ─── Inventory Routes — FEFO Batch & Dispense Endpoints ─────────────────
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Maps HTTP endpoints to the FEFO inventory controller handlers.
 *
 * Route structure (all mounted under /api/inventory in app.ts):
 *
 *   POST  /batch    → Add a new inventory batch (receiving shipment)
 *   POST  /dispense → Dispense medication using FEFO algorithm
 *
 * These routes complement the existing inventory.routes.ts which handles
 * the FEFO dry-run preview, expiry alerts, and low-stock alerts.
 */

import { Router } from "express";
import {
  addBatch,
  dispenseMedication,
} from "../controllers/inventoryController";
import { protect, authorizeRoles } from "../middleware/authMiddleware";
import { UserRole } from "../types/enums";
import { validateRequest } from "../middleware/validate";
import {
  createBatchSchema,
  dispenseSchema,
} from "../validations/inventory.validation";

const router: Router = Router();

// ─── POST /api/inventory/batch ──────────────────────────────────────────────
// Receives a new shipment of medication into inventory.
// Body: { productId, batchNumber, quantity, expiryDate, purchasePrice,
//         sellingPrice, manufacturingDate?, supplierId?, receivedDate?, notes? }
router.post(
  "/batch",
  protect,
  authorizeRoles(UserRole.ADMIN, UserRole.PHARMACIST),
  validateRequest(createBatchSchema),
  addBatch
);

// ─── POST /api/inventory/dispense ───────────────────────────────────────────
// The FEFO engine: deducts stock from batches nearest to expiry first.
// Body: { productId, quantityToDispense }
// Returns a detailed breakdown of which batches were affected.
router.post(
  "/dispense",
  protect,
  authorizeRoles(UserRole.ADMIN, UserRole.PHARMACIST, UserRole.CASHIER),
  validateRequest(dispenseSchema),
  dispenseMedication
);

export default router;
