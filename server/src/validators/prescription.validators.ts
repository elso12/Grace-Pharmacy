/**
 * ─── Prescription & Safety Check Validation Schemas ───────────────────────
 * Zod v4 schemas for prescription endpoints, including the clinical
 * drug interaction and allergy safety check engine.
 */

import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

// ─── Medication Item Input ──────────────────────────────────────────────────
// Accepts either a plain string (e.g. "Warfarin") or a structured object
// (e.g. { name: "Warfarin", rxcui: "11289" }).
const medicationInputSchema = z
  .union([
    z.string().min(1, "Medication name cannot be empty").transform((name) => ({
      name: name.trim(),
      rxcui: undefined as string | undefined,
    })),
    z.object({
      name: z.string("Medication name is required").min(1, "Medication name cannot be empty"),
      rxcui: z.string().optional(),
    }),
  ])
  .transform((item) => ({
    name: item.name.trim(),
    rxcui: item.rxcui?.trim() || undefined,
  }));

export type MedicationInput = z.infer<typeof medicationInputSchema>;

// ─── POST /api/prescriptions/safety-check ───────────────────────────────────
export const safetyCheckSchema = z.object({
  /**
   * Optional MongoDB ObjectId of the patient (Customer) to check against
   * recorded allergies in MongoDB.
   */
  patientId: z
    .string()
    .regex(objectIdRegex, "Invalid Patient ID format")
    .optional(),

  /**
   * List of active medications / prescriptions to evaluate for interactions
   * and allergy conflicts. Requires at least 1 medication.
   */
  medications: z
    .array(medicationInputSchema, "Medications must be an array")
    .min(1, "At least one medication is required for a safety check")
    .max(20, "Cannot check more than 20 medications simultaneously"),

  /**
   * Optional inline allergies list if checking without a saved MongoDB patient.
   */
  customAllergies: z
    .array(
      z.object({
        substance: z.string().min(1),
        severity: z.enum(["MILD", "MODERATE", "SEVERE"]).default("MODERATE"),
      })
    )
    .optional(),
});

export type SafetyCheckInput = z.infer<typeof safetyCheckSchema>;
