/**
 * ─── POS & Dispensing Screen Mock Data & Types ────────────────────────────
 * Comprehensive catalog, patient database, FEFO inventory batches, and
 * clinical drug interaction rules for high-performance pharmacy operations.
 */

export interface InventoryBatch {
  id: string;
  productId: string;
  batchNumber: string;
  quantity: number;
  expiryDate: string; // ISO date string YYYY-MM-DD
  purchasePrice: number;
  sellingPrice: number;
  isRecommended?: boolean; // FEFO recommended flag
}

export interface MedicationProduct {
  id: string;
  name: string;
  genericName: string;
  sku: string;
  barcode: string;
  category: "PRESCRIPTION" | "OTC" | "CONTROLLED" | "SUPPLEMENT";
  requiresPrescription: boolean;
  price: number;
  totalStock: number;
  dosageForm: string;
  strength: string;
  batches: InventoryBatch[];
}

export interface PatientAllergy {
  substance: string;
  severity: "MILD" | "MODERATE" | "SEVERE";
  notes?: string;
}

export interface ActivePrescription {
  prescriptionNumber: string;
  date: string;
  doctor: string;
  items: {
    productName: string;
    dosage: string;
    frequency: string;
    duration: string;
    quantity: number;
  }[];
}

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  dateOfBirth: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  allergies: PatientAllergy[];
  medicalConditions: string[];
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  activePrescriptions: ActivePrescription[];
}

export interface CartItem {
  id: string;
  product: MedicationProduct;
  selectedBatch: InventoryBatch;
  quantity: number;
  unitPrice: number;
  discount: number; // percentage 0-100
  dosageInstructions?: string;
  lineTotal: number;
}

export interface ClinicalWarning {
  id: string;
  type: "DRUG_INTERACTION" | "ALLERGY_CONFLICT";
  severity: "HIGH" | "MEDIUM" | "LOW";
  title: string;
  description: string;
  relatedItems: string[]; // drug names or allergy substances involved
}

// ═════════════════════════════════════════════════════════════════════════════
// ─── SAMPLE PATIENT DATABASE ───────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

export const MOCK_PATIENTS: Patient[] = [
  {
    id: "pat-101",
    firstName: "Eleanor",
    lastName: "Vance",
    phone: "555-0192",
    email: "e.vance@example.com",
    dateOfBirth: "1968-04-12",
    gender: "FEMALE",
    allergies: [
      { substance: "Penicillin", severity: "SEVERE", notes: "Anaphylaxis in 2018" },
      { substance: "Sulfa", severity: "MODERATE", notes: "Severe rash and hives" },
    ],
    medicalConditions: ["Hypertension", "Type 2 Diabetes", "Atrial Fibrillation"],
    insuranceProvider: "BlueCross HealthShield",
    insurancePolicyNumber: "BC-8890231-X",
    activePrescriptions: [
      {
        prescriptionNumber: "RX-2026-8901",
        date: "2026-07-20",
        doctor: "Dr. Marcus Vance, MD (Cardiology)",
        items: [
          {
            productName: "Warfarin 5mg Tablet",
            dosage: "1 tablet",
            frequency: "Once daily in the evening",
            duration: "30 days",
            quantity: 30,
          },
          {
            productName: "Lisinopril 10mg Tablet",
            dosage: "1 tablet",
            frequency: "Once daily in the morning",
            duration: "30 days",
            quantity: 30,
          },
        ],
      },
    ],
  },
  {
    id: "pat-102",
    firstName: "Robert",
    lastName: "Chen",
    phone: "555-0348",
    email: "r.chen@example.com",
    dateOfBirth: "1982-11-05",
    gender: "MALE",
    allergies: [
      { substance: "Aspirin", severity: "SEVERE", notes: "Bronchospasm / Asthma trigger" },
      { substance: "NSAID", severity: "MODERATE", notes: "GI bleeding history" },
    ],
    medicalConditions: ["Chronic Lower Back Pain", "GERD"],
    insuranceProvider: "UnitedHealth Alliance",
    insurancePolicyNumber: "UH-4459012-C",
    activePrescriptions: [
      {
        prescriptionNumber: "RX-2026-9012",
        date: "2026-07-25",
        doctor: "Dr. Sarah Jenkins, MD (Orthopedics)",
        items: [
          {
            productName: "Tramadol 50mg Tablet",
            dosage: "1 tablet",
            frequency: "Every 6 hours as needed for severe pain",
            duration: "14 days",
            quantity: 40,
          },
        ],
      },
    ],
  },
  {
    id: "pat-103",
    firstName: "Sophia",
    lastName: "Rodriguez",
    phone: "555-0781",
    email: "sophia.r@example.com",
    dateOfBirth: "1995-08-22",
    gender: "FEMALE",
    allergies: [],
    medicalConditions: ["Mild Asthma"],
    insuranceProvider: "Aetna LifeCare",
    insurancePolicyNumber: "AE-1120934-Z",
    activePrescriptions: [],
  },
];

// ═════════════════════════════════════════════════════════════════════════════
// ─── SAMPLE MEDICATION CATALOG WITH FEFO BATCHES ───────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

export const MOCK_MEDICATIONS: MedicationProduct[] = [
  {
    id: "prod-001",
    name: "Warfarin",
    genericName: "warfarin sodium",
    sku: "RX-WAR-005",
    barcode: "8901234500001",
    category: "PRESCRIPTION",
    requiresPrescription: true,
    price: 18.5,
    totalStock: 145,
    dosageForm: "Tablet",
    strength: "5mg",
    batches: [
      {
        id: "b-war-01",
        productId: "prod-001",
        batchNumber: "WAR-2026-08A",
        quantity: 45,
        expiryDate: "2026-08-15", // Expiring very soon! FEFO recommended
        purchasePrice: 12.0,
        sellingPrice: 18.5,
        isRecommended: true,
      },
      {
        id: "b-war-02",
        productId: "prod-001",
        batchNumber: "WAR-2027-03B",
        quantity: 100,
        expiryDate: "2027-03-30",
        purchasePrice: 12.0,
        sellingPrice: 18.5,
        isRecommended: false,
      },
    ],
  },
  {
    id: "prod-002",
    name: "Aspirin Protect",
    genericName: "acetylsalicylic acid",
    sku: "OTC-ASP-100",
    barcode: "8901234500002",
    category: "OTC",
    requiresPrescription: false,
    price: 8.99,
    totalStock: 320,
    dosageForm: "Enteric Coated Tablet",
    strength: "100mg",
    batches: [
      {
        id: "b-asp-01",
        productId: "prod-002",
        batchNumber: "ASP-2026-10A",
        quantity: 120,
        expiryDate: "2026-10-01",
        purchasePrice: 4.5,
        sellingPrice: 8.99,
        isRecommended: true,
      },
      {
        id: "b-asp-02",
        productId: "prod-002",
        batchNumber: "ASP-2028-05C",
        quantity: 200,
        expiryDate: "2028-05-15",
        purchasePrice: 4.5,
        sellingPrice: 8.99,
        isRecommended: false,
      },
    ],
  },
  {
    id: "prod-003",
    name: "Amoxicillin Trihydrate",
    genericName: "amoxicillin",
    sku: "RX-AMX-500",
    barcode: "8901234500003",
    category: "PRESCRIPTION",
    requiresPrescription: true,
    price: 15.0,
    totalStock: 80,
    dosageForm: "Capsule",
    strength: "500mg",
    batches: [
      {
        id: "b-amx-01",
        productId: "prod-003",
        batchNumber: "AMX-2026-09X",
        quantity: 30,
        expiryDate: "2026-09-10",
        purchasePrice: 9.0,
        sellingPrice: 15.0,
        isRecommended: true,
      },
      {
        id: "b-amx-02",
        productId: "prod-003",
        batchNumber: "AMX-2027-11Y",
        quantity: 50,
        expiryDate: "2027-11-20",
        purchasePrice: 9.0,
        sellingPrice: 15.0,
        isRecommended: false,
      },
    ],
  },
  {
    id: "prod-004",
    name: "Lisinopril",
    genericName: "lisinopril",
    sku: "RX-LIS-010",
    barcode: "8901234500004",
    category: "PRESCRIPTION",
    requiresPrescription: true,
    price: 22.0,
    totalStock: 190,
    dosageForm: "Tablet",
    strength: "10mg",
    batches: [
      {
        id: "b-lis-01",
        productId: "prod-004",
        batchNumber: "LIS-2027-01A",
        quantity: 90,
        expiryDate: "2027-01-15",
        purchasePrice: 14.0,
        sellingPrice: 22.0,
        isRecommended: true,
      },
      {
        id: "b-lis-02",
        productId: "prod-004",
        batchNumber: "LIS-2027-09B",
        quantity: 100,
        expiryDate: "2027-09-30",
        purchasePrice: 14.0,
        sellingPrice: 22.0,
        isRecommended: false,
      },
    ],
  },
  {
    id: "prod-005",
    name: "Tramadol HCL",
    genericName: "tramadol hydrochloride",
    sku: "CTL-TRM-050",
    barcode: "8901234500005",
    category: "CONTROLLED",
    requiresPrescription: true,
    price: 35.0,
    totalStock: 60,
    dosageForm: "Tablet",
    strength: "50mg",
    batches: [
      {
        id: "b-trm-01",
        productId: "prod-005",
        batchNumber: "TRM-2026-12Z",
        quantity: 60,
        expiryDate: "2026-12-01",
        purchasePrice: 22.0,
        sellingPrice: 35.0,
        isRecommended: true,
      },
    ],
  },
  {
    id: "prod-006",
    name: "Fluoxetine",
    genericName: "fluoxetine hydrochloride",
    sku: "RX-FLX-020",
    barcode: "8901234500006",
    category: "PRESCRIPTION",
    requiresPrescription: true,
    price: 28.5,
    totalStock: 110,
    dosageForm: "Capsule",
    strength: "20mg",
    batches: [
      {
        id: "b-flx-01",
        productId: "prod-006",
        batchNumber: "FLX-2027-04A",
        quantity: 110,
        expiryDate: "2027-04-20",
        purchasePrice: 18.0,
        sellingPrice: 28.5,
        isRecommended: true,
      },
    ],
  },
  {
    id: "prod-007",
    name: "Paracetamol Advance",
    genericName: "acetaminophen",
    sku: "OTC-PAR-500",
    barcode: "8901234500007",
    category: "OTC",
    requiresPrescription: false,
    price: 5.5,
    totalStock: 500,
    dosageForm: "Tablet",
    strength: "500mg",
    batches: [
      {
        id: "b-par-01",
        productId: "prod-007",
        batchNumber: "PAR-2027-08A",
        quantity: 250,
        expiryDate: "2027-08-01",
        purchasePrice: 2.5,
        sellingPrice: 5.5,
        isRecommended: true,
      },
      {
        id: "b-par-02",
        productId: "prod-007",
        batchNumber: "PAR-2028-12B",
        quantity: 250,
        expiryDate: "2028-12-15",
        purchasePrice: 2.5,
        sellingPrice: 5.5,
        isRecommended: false,
      },
    ],
  },
  {
    id: "prod-008",
    name: "Potassium Chloride SR",
    genericName: "potassium chloride",
    sku: "RX-POT-600",
    barcode: "8901234500008",
    category: "PRESCRIPTION",
    requiresPrescription: true,
    price: 14.0,
    totalStock: 130,
    dosageForm: "Extended Release Tablet",
    strength: "600mg",
    batches: [
      {
        id: "b-pot-01",
        productId: "prod-008",
        batchNumber: "POT-2027-06A",
        quantity: 130,
        expiryDate: "2027-06-30",
        purchasePrice: 8.0,
        sellingPrice: 14.0,
        isRecommended: true,
      },
    ],
  },
];

// ═════════════════════════════════════════════════════════════════════════════
// ─── CLIENT-SIDE SAFETY & INTERACTION ENGINE ───────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

export function evaluateClinicalSafety(
  cartItems: CartItem[],
  patient: Patient | null
): ClinicalWarning[] {
  const warnings: ClinicalWarning[] = [];
  if (cartItems.length === 0) return warnings;

  const names = cartItems.map((i) => i.product.name.toLowerCase());
  const generics = cartItems.map((i) => i.product.genericName.toLowerCase());

  // 1. DRUG-DRUG INTERACTIONS
  // Warfarin + Aspirin
  if (
    (names.some((n) => n.includes("warfarin")) || generics.some((g) => g.includes("warfarin"))) &&
    (names.some((n) => n.includes("aspirin")) || generics.some((g) => g.includes("acetylsalicylic")))
  ) {
    warnings.push({
      id: "warn-war-asp",
      type: "DRUG_INTERACTION",
      severity: "HIGH",
      title: "CRITICAL BLEEDING RISK: Warfarin + Aspirin",
      description:
        "Concurrent administration significantly increases risk of severe gastrointestinal hemorrhage and systemic bleeding. Aspirin inhibits platelet aggregation while Warfarin inhibits vitamin K-dependent clotting factors.",
      relatedItems: ["Warfarin", "Aspirin Protect"],
    });
  }

  // Lisinopril + Potassium
  if (
    (names.some((n) => n.includes("lisinopril")) || generics.some((g) => g.includes("lisinopril"))) &&
    (names.some((n) => n.includes("potassium")) || generics.some((g) => g.includes("potassium")))
  ) {
    warnings.push({
      id: "warn-lis-pot",
      type: "DRUG_INTERACTION",
      severity: "HIGH",
      title: "SEVERE HYPERKALEMIA RISK: Lisinopril + Potassium",
      description:
        "ACE inhibitors decrease aldosterone secretion, impairing renal potassium excretion. Co-administration with potassium supplements can cause lethal cardiac arrhythmias.",
      relatedItems: ["Lisinopril", "Potassium Chloride SR"],
    });
  }

  // Tramadol + Fluoxetine
  if (
    (names.some((n) => n.includes("tramadol")) || generics.some((g) => g.includes("tramadol"))) &&
    (names.some((n) => n.includes("fluoxetine")) || generics.some((g) => g.includes("fluoxetine")))
  ) {
    warnings.push({
      id: "warn-trm-flx",
      type: "DRUG_INTERACTION",
      severity: "HIGH",
      title: "SEROTONIN SYNDROME & SEIZURE RISK: Tramadol + Fluoxetine",
      description:
        "Fluoxetine inhibits CYP2D6 (reducing tramadol analgesic efficacy) and both agents synergistically increase CNS serotonergic activity, risking fatal serotonin syndrome.",
      relatedItems: ["Tramadol HCL", "Fluoxetine"],
    });
  }

  // 2. PATIENT ALLERGY CONFLICTS
  if (patient && patient.allergies.length > 0) {
    for (const item of cartItems) {
      const prodName = item.product.name.toLowerCase();
      const prodGen = item.product.genericName.toLowerCase();

      for (const allergy of patient.allergies) {
        const sub = allergy.substance.toLowerCase();

        const isDirectMatch = prodName.includes(sub) || prodGen.includes(sub);
        const isPenicillinMatch = sub.includes("penicillin") && (prodName.includes("amoxicillin") || prodGen.includes("amoxicillin"));
        const isNsaidMatch = (sub.includes("nsaid") || sub.includes("aspirin")) && (prodName.includes("aspirin") || prodGen.includes("acetylsalicylic"));

        if (isDirectMatch || isPenicillinMatch || isNsaidMatch) {
          warnings.push({
            id: `allergy-${item.id}-${allergy.substance}`,
            type: "ALLERGY_CONFLICT",
            severity: allergy.severity === "SEVERE" ? "HIGH" : "MEDIUM",
            title: `PATIENT ALLERGY CONFLICT: ${item.product.name}`,
            description: `Patient has a documented ${allergy.severity} allergy to '${allergy.substance}'${allergy.notes ? ` (${allergy.notes})` : ""}. Dispensing this medication may trigger an immediate allergic reaction.`,
            relatedItems: [item.product.name, `Allergy: ${allergy.substance}`],
          });
        }
      }
    }
  }

  // Sort HIGH severity first
  return warnings.sort((a, b) => (a.severity === "HIGH" ? -1 : b.severity === "HIGH" ? 1 : 0));
}
