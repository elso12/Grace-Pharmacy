/**
 * ─── Route Barrel Export ──────────────────────────────────────────────────
 * Stub route files for each domain entity. Inventory is fully implemented;
 * the rest will be expanded with full CRUD as controllers are built.
 */

import { Router } from "express";
import inventoryRoutes from "./inventory.routes";
import prescriptionRoutes from "./prescription.routes";

// ─── Auth Routes ────────────────────────────────────────────────────────────
export const authRouter = Router();
authRouter.get("/", (_req, res) => {
  res.json({ message: "Auth routes — coming soon" });
});


import productRoutes from "./productRoutes";
export const productRouter = productRoutes;

// ─── Inventory Routes (FULLY IMPLEMENTED) ───────────────────────────────────
export const inventoryRouter = inventoryRoutes;

import customerRoutes from "./customerRoutes";
export { default as messageRouter } from './messageRoutes';
export const customerRouter = customerRoutes;

// ─── Prescription Routes (FULLY IMPLEMENTED) ────────────────────────────────
export const prescriptionRouter = prescriptionRoutes;

import saleRoutes from "./saleRoutes";

// ─── Sale Routes (POS Checkout) ───────────────────────────────────────────────
export const saleRouter = saleRoutes;

// ─── Supplier Routes ────────────────────────────────────────────────────────
export const supplierRouter = Router();
supplierRouter.get("/", (_req, res) => {
  res.json({ message: "Supplier routes — coming soon" });
});

// ─── Audit Routes ───────────────────────────────────────────────────────────
import auditRoutes from "./auditRoutes";
export const auditRouter = auditRoutes;

// ─── User Routes ────────────────────────────────────────────────────────────
import userRoutes from "./userRoutes";
export const userRouter = userRoutes;

