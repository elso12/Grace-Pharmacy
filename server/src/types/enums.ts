// ─── User Roles ─────────────────────────────────────────────────────────────
export enum UserRole {
  ADMIN = "ADMIN",
  PHARMACIST = "PHARMACIST",
  TECHNICIAN = "TECHNICIAN",
  CASHIER = "CASHIER",
  CUSTOMER = "CUSTOMER",
}

// ─── Prescription Status ────────────────────────────────────────────────────
export enum PrescriptionStatus {
  PENDING = "PENDING", // Used for patient-submitted but not yet finalized
  PENDING_VERIFICATION = "PENDING_VERIFICATION", // Awaiting Pharmacist review
  IN_REVIEW = "IN_REVIEW",
  APPROVED = "APPROVED",
  APPROVED_WITH_NOTES = "APPROVED_WITH_NOTES",
  REJECTED = "REJECTED",
  DISPENSED = "DISPENSED",
  CANCELLED = "CANCELLED",
  PARTIALLY_DISPENSED = "PARTIALLY_DISPENSED",
  EXPIRED = "EXPIRED",
}

// ─── Payment Method ────────────────────────────────────────────────────────
export enum PaymentMethod {
  CASH = "CASH",
  CARD = "CARD",
  INSURANCE = "INSURANCE",
  MOBILE_WALLET = "MOBILE_WALLET",
}

// ─── Product Category ──────────────────────────────────────────────────────
export enum ProductCategory {
  PRESCRIPTION = "PRESCRIPTION",
  OTC = "OTC",               // Over-The-Counter
  CONTROLLED = "CONTROLLED",
  SUPPLEMENT = "SUPPLEMENT",
  MEDICAL_DEVICE = "MEDICAL_DEVICE",
  COSMETIC = "COSMETIC",
  OTHER = "OTHER",
  // Storefront Categories
  VITAMINS = "Vitamins",
  PAIN_RELIEF = "Pain Relief",
  ALLERGY = "Allergy",
  FIRST_AID = "First Aid",
  COLD_FLU = "Cold & Flu",
  DIGESTIVE_HEALTH = "Digestive Health",
  MOTHER_BABY = "Mother & Baby",
}

// ─── Sale Status ────────────────────────────────────────────────────────────
export enum SaleStatus {
  COMPLETED = "COMPLETED",
  REFUNDED = "REFUNDED",
  PARTIALLY_REFUNDED = "PARTIALLY_REFUNDED",
  VOIDED = "VOIDED",
}

// ─── Batch Status ───────────────────────────────────────────────────────────
export enum BatchStatus {
  ACTIVE = "ACTIVE",
  DEPLETED = "DEPLETED",
  EXPIRED = "EXPIRED",
  RECALLED = "RECALLED",
  QUARANTINED = "QUARANTINED",
}

// ─── Order Status ───────────────────────────────────────────────────────────
export enum OrderStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  PACKED = "PACKED",
  READY_FOR_PICKUP = "READY_FOR_PICKUP",
  OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY",
  DELIVERED = "DELIVERED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

// ─── Order Type ─────────────────────────────────────────────────────────────
export enum OrderType {
  ONLINE = "ONLINE",
  POS = "POS",
}

// ─── Fulfillment Type ───────────────────────────────────────────────────────
export enum FulfillmentType {
  PICKUP = "PICKUP",
  DELIVERY = "DELIVERY",
}

// ─── Order Payment Status ───────────────────────────────────────────────────
export enum OrderPaymentStatus {
  UNPAID = "UNPAID",
  PAID = "PAID",
  REFUNDED = "REFUNDED",
}

// ─── Cycle Count Status ─────────────────────────────────────────────────────
export enum CycleCountStatus {
  PENDING_REVIEW = "PENDING_REVIEW",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}
