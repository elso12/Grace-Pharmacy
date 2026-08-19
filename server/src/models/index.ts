/**
 * ─── Model Barrel Export ──────────────────────────────────────────────────
 * Central re-export for all Mongoose models.
 * Import from '@/models' instead of individual files.
 */

export { default as User } from "./User.model";
export { default as Product } from "./Product.model";
export { default as InventoryBatch } from "./InventoryBatch.model";
export { default as Customer } from "./Customer.model";
export { default as Prescription } from "./Prescription.model";
export { default as Sale } from "./Sale.model";
export { default as Supplier } from "./Supplier.model";
export { default as Order } from "./Order.model";

