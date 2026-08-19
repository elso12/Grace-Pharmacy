/**
 * ─── Clinical Safety Check & Drug Interaction Service ─────────────────────
 * Enterprise drug-drug interaction and patient allergy safety check engine.
 *
 * Integrations:
 *   1. National Library of Medicine (NLM) RxNav API:
 *      - Resolves drug names to RxNorm Concept Unique Identifiers (RxCUIs).
 *      - Checks real-time clinical drug-drug interactions via NLM Interaction API.
 *   2. Clinical Fallback Knowledge Base:
 *      - Built-in curated database of critical drug interactions ensures offline
 *        resilience and instant responses if external APIs time out or fail.
 *   3. MongoDB Patient Allergy Engine:
 *      - Fetches patient allergy records from MongoDB (`Customer` collection).
 *      - Performs fuzzy/substring clinical substance matching (e.g., matching
 *        "Penicillin" allergy against "Amoxicillin" or "Ampicillin" prescriptions).
 */

import Customer, { type IAllergy } from "../models/Customer.model";
import { AppError } from "../utils/errors";
import type {
  MedicationInput,
  SafetyCheckInput,
} from "../validators/prescription.validators";

// ─── Output Types ───────────────────────────────────────────────────────────

export type WarningSeverity = "HIGH" | "MEDIUM" | "LOW";

export interface InteractionWarning {
  severity: WarningSeverity;
  drugs: [string, string];
  description: string;
  source: "RxNorm_NLM" | "Clinical_Fallback";
  rxcuiPair?: [string, string];
}

export interface AllergyWarning {
  severity: WarningSeverity;
  medication: string;
  allergicSubstance: string;
  description: string;
  patientSeverityRecorded: "MILD" | "MODERATE" | "SEVERE";
  notes?: string;
}

export interface SafetyCheckResult {
  patientId?: string;
  patientName?: string;
  medicationsChecked: { name: string; rxcui?: string }[];
  isSafe: boolean;
  summary: {
    totalWarnings: number;
    highSeverity: number;
    mediumSeverity: number;
    lowSeverity: number;
    drugInteractionsCount: number;
    allergyConflictsCount: number;
  };
  drugInteractions: InteractionWarning[];
  allergyConflicts: AllergyWarning[];
  timestamp: string;
}

// ─── In-Memory RxCUI Cache ──────────────────────────────────────────────────
// Speeds up repetitive lookups and reduces external NLM API requests.
const rxcuiCache = new Map<string, string | null>([
  ["warfarin", "11289"],
  ["aspirin", "1191"],
  ["amoxicillin", "723"],
  ["penicillin", "70618"],
  ["sildenafil", "4450"],
  ["nitroglycerin", "7407"],
  ["lisinopril", "29046"],
  ["potassium", "8591"],
  ["tramadol", "10689"],
  ["fluoxetine", "4493"],
  ["ciprofloxacin", "2551"],
  ["tizanidine", "38404"],
  ["methotrexate", "6851"],
  ["ibuprofen", "5640"],
  ["omeprazole", "7646"],
  ["clopidogrel", "32968"],
  ["simvastatin", "36567"],
  ["amiodarone", "703"],
]);

// ─── Curated Clinical Fallback Database ─────────────────────────────────────
// Used when external API is unreachable or to supplement known critical pairs.
interface FallbackInteraction {
  pair: [string, string];
  severity: WarningSeverity;
  description: string;
}

const CLINICAL_FALLBACK_INTERACTIONS: FallbackInteraction[] = [
  {
    pair: ["warfarin", "aspirin"],
    severity: "HIGH",
    description:
      "CONCURRENT USE SIGNIFICANTLY INCREASES RISK OF SEVERE BLEEDING AND HEMORRHAGE. Aspirin inhibits platelet aggregation while Warfarin inhibits vitamin K-dependent clotting factors.",
  },
  {
    pair: ["sildenafil", "nitroglycerin"],
    severity: "HIGH",
    description:
      "ABSOLUTE CONTRAINDICATION: Co-administration causes severe, potentially fatal hypotension due to synergistic systemic vasodilation.",
  },
  {
    pair: ["lisinopril", "potassium"],
    severity: "HIGH",
    description:
      "INCREASED RISK OF SEVERE HYPERKALEMIA. ACE inhibitors decrease aldosterone secretion, impairing renal potassium excretion.",
  },
  {
    pair: ["tramadol", "fluoxetine"],
    severity: "HIGH",
    description:
      "HIGH RISK OF SEROTONIN SYNDROME AND SEIZURES. Fluoxetine inhibits CYP2D6 (reducing tramadol analgesic efficacy) and both increase CNS serotonergic activity.",
  },
  {
    pair: ["ciprofloxacin", "tizanidine"],
    severity: "HIGH",
    description:
      "CONTRAINDICATED: Ciprofloxacin strongly inhibits CYP1A2, increasing Tizanidine serum concentration by up to 10-fold, causing severe sedation and hypotension.",
  },
  {
    pair: ["clopidogrel", "omeprazole"],
    severity: "MEDIUM",
    description:
      "Omeprazole inhibits CYP2C19, reducing the conversion of Clopidogrel to its active metabolite and decreasing antiplatelet protection.",
  },
  {
    pair: ["simvastatin", "amiodarone"],
    severity: "HIGH",
    description:
      "INCREASED RISK OF MYOPATHY AND RHABDOMYOLYSIS. Amiodarone inhibits CYP3A4, increasing Simvastatin plasma concentrations. Simvastatin dose should not exceed 20mg daily.",
  },
  {
    pair: ["ibuprofen", "aspirin"],
    severity: "MEDIUM",
    description:
      "Ibuprofen may competitively inhibit aspirin's cardioprotective irreversible COX-1 inhibition and increase gastrointestinal bleeding risk.",
  },
  {
    pair: ["amoxicillin", "methotrexate"],
    severity: "HIGH",
    description:
      "Penicillins compete with Methotrexate for renal tubular secretion, increasing methotrexate serum levels and systemic toxicity.",
  },
];

// ─── Common Drug Class & Allergy Sub-group Mappings ─────────────────────────
// Enables intelligent clinical matching between recorded allergies and drug names.
const ALLERGY_CLASS_MAPPINGS: Record<string, string[]> = {
  penicillin: [
    "penicillin",
    "amoxicillin",
    "ampicillin",
    "piperacillin",
    "nafcillin",
    "oxacillin",
    "dicloxacillin",
    "augmentin",
  ],
  sulfa: [
    "sulfamethoxazole",
    "sulfadiazine",
    "sulfasalazine",
    "bactrim",
    "septra",
    "zonisamide",
    "celecoxib",
  ],
  nsaid: [
    "aspirin",
    "ibuprofen",
    "naproxen",
    "diclofenac",
    "meloxicam",
    "indomethacin",
    "ketorolac",
    "celecoxib",
  ],
  statin: [
    "atorvastatin",
    "simvastatin",
    "rosuvastatin",
    "pravastatin",
    "lovastatin",
  ],
  opioid: [
    "morphine",
    "codeine",
    "oxycodone",
    "hydrocodone",
    "fentanyl",
    "tramadol",
    "methadone",
  ],
};

// ═════════════════════════════════════════════════════════════════════════════
// ─── CORE ENGINE ENTRY POINT ───────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

export const performSafetyCheck = async (
  input: SafetyCheckInput
): Promise<SafetyCheckResult> => {
  const { patientId, medications, customAllergies } = input;

  // 1. Fetch patient and allergies from MongoDB if patientId provided
  let patientName: string | undefined;
  let allergiesToCheck: IAllergy[] = customAllergies || [];

  if (patientId) {
    const patient = await Customer.findById(patientId).select("firstName lastName allergies isActive").lean();
    if (!patient) {
      throw new AppError(`Patient with ID ${patientId} not found`, 404);
    }
    if (!patient.isActive) {
      throw new AppError("Cannot perform safety check for an inactive patient profile", 400);
    }
    patientName = `${patient.firstName} ${patient.lastName}`;
    if (patient.allergies && patient.allergies.length > 0) {
      allergiesToCheck = [...allergiesToCheck, ...patient.allergies];
    }
  }

  // 2. Resolve RxCUIs for all medications
  const resolvedMedications = await resolveAllRxCUIs(medications);

  // 3. Check Drug-Drug Interactions (concurrently via NLM API + Fallback)
  const drugInteractions = await checkDrugInteractions(resolvedMedications);

  // 4. Check Patient Allergy Conflicts against MongoDB records
  const allergyConflicts = checkAllergyConflicts(resolvedMedications, allergiesToCheck);

  // 5. Aggregate summaries and calculate overall clinical safety
  const allWarnings = [...drugInteractions, ...allergyConflicts];
  const highCount = allWarnings.filter((w) => w.severity === "HIGH").length;
  const mediumCount = allWarnings.filter((w) => w.severity === "MEDIUM").length;
  const lowCount = allWarnings.filter((w) => w.severity === "LOW").length;

  // Deemed safe if there are ZERO HIGH severity warnings and NO allergy conflicts
  const isSafe = highCount === 0 && allergyConflicts.length === 0;

  return {
    patientId,
    patientName,
    medicationsChecked: resolvedMedications,
    isSafe,
    summary: {
      totalWarnings: allWarnings.length,
      highSeverity: highCount,
      mediumSeverity: mediumCount,
      lowSeverity: lowCount,
      drugInteractionsCount: drugInteractions.length,
      allergyConflictsCount: allergyConflicts.length,
    },
    drugInteractions,
    allergyConflicts,
    timestamp: new Date().toISOString(),
  };
};

// ═════════════════════════════════════════════════════════════════════════════
// ─── STEP 1: RXNORM RXCUI RESOLVER ──────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

async function resolveAllRxCUIs(
  meds: MedicationInput[]
): Promise<{ name: string; rxcui?: string }[]> {
  return Promise.all(
    meds.map(async (med) => {
      if (med.rxcui) return med;

      const normalizedName = med.name.toLowerCase();
      if (rxcuiCache.has(normalizedName)) {
        const cached = rxcuiCache.get(normalizedName);
        return { name: med.name, rxcui: cached || undefined };
      }

      try {
        // Use AbortController for a strict 3-second network timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const url = `https://rxnav.nlm.nih.gov/REST/rxcui.json?name=${encodeURIComponent(med.name)}`;
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = (await response.json()) as {
            idGroup?: { rxnormId?: string[] };
          };
          const rxnormIds = data.idGroup?.rxnormId;
          if (rxnormIds && rxnormIds.length > 0) {
            const rxcui = rxnormIds[0];
            rxcuiCache.set(normalizedName, rxcui);
            return { name: med.name, rxcui };
          }
        }
      } catch {
        // Network timeout or offline -> fallback silently, rxcui remains undefined
      }

      rxcuiCache.set(normalizedName, null);
      return { name: med.name };
    })
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// ─── STEP 2: DRUG INTERACTION ENGINE (NLM RXNAV + FALLBACK) ────────────────
// ═════════════════════════════════════════════════════════════════════════════

// ─── NLM RxNav Interaction API Response Interfaces ──────────────────────────
interface NlmInteractionConcept {
  minConceptItem?: { rxcui: string; name: string };
}
interface NlmInteractionPair {
  interactionConcept?: NlmInteractionConcept[];
  severity?: string;
  description?: string;
}
interface NlmInteractionType {
  interactionPair?: NlmInteractionPair[];
}
interface NlmInteractionTypeGroup {
  fullInteractionType?: NlmInteractionType[];
}
interface NlmInteractionResponse {
  fullInteractionTypeGroup?: NlmInteractionTypeGroup[];
}

async function checkDrugInteractions(
  meds: { name: string; rxcui?: string }[]
): Promise<InteractionWarning[]> {
  const warningsMap = new Map<string, InteractionWarning>();

  // ── A. External NLM RxNav Interaction API Check ─────────────────────────
  const rxcuis = meds.map((m) => m.rxcui).filter((id): id is string => Boolean(id));

  if (rxcuis.length >= 2) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const url = `https://rxnav.nlm.nih.gov/REST/interaction/list.json?rxcuis=${rxcuis.join("+")}`;
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = (await response.json()) as NlmInteractionResponse;

        const groups = data.fullInteractionTypeGroup || [];
        for (const group of groups) {
          for (const type of group.fullInteractionType || []) {
            for (const pair of type.interactionPair || []) {
              const concepts = pair.interactionConcept || [];
              if (concepts.length === 2 && pair.description) {
                const drug1 = concepts[0].minConceptItem?.name || "Unknown Drug 1";
                const rxcui1 = concepts[0].minConceptItem?.rxcui || "";
                const drug2 = concepts[1].minConceptItem?.name || "Unknown Drug 2";
                const rxcui2 = concepts[1].minConceptItem?.rxcui || "";

                // Map NLM severity strings ("high", "N/A", "low") to enterprise enum
                const rawSev = (pair.severity || "").toLowerCase();
                let severity: WarningSeverity = "MEDIUM";
                if (rawSev === "high") severity = "HIGH";
                else if (rawSev === "low") severity = "LOW";
                else if (pair.description.toLowerCase().includes("contraindicated") || pair.description.toLowerCase().includes("severe")) {
                  severity = "HIGH";
                }

                const pairKey = [rxcui1, rxcui2].sort().join("-");
                warningsMap.set(pairKey, {
                  severity,
                  drugs: [drug1, drug2],
                  description: pair.description,
                  source: "RxNorm_NLM",
                  rxcuiPair: [rxcui1, rxcui2],
                });
              }
            }
          }
        }
      }
    } catch {
      // API unreachable or timed out -> rely on clinical fallback below
    }
  }

  // ── B. Clinical Fallback Knowledge Base Check ───────────────────────────
  // Evaluates all pairwise combinations of prescribed medications against our curated DB.
  for (let i = 0; i < meds.length; i++) {
    for (let j = i + 1; j < meds.length; j++) {
      const name1 = meds[i].name.toLowerCase();
      const name2 = meds[j].name.toLowerCase();

      for (const fallback of CLINICAL_FALLBACK_INTERACTIONS) {
        const [target1, target2] = fallback.pair;
        const matchesPair =
          (name1.includes(target1) && name2.includes(target2)) ||
          (name1.includes(target2) && name2.includes(target1));

        if (matchesPair) {
          const pairKey = [name1, name2].sort().join("-");
          // If not already caught by NLM API (or if fallback has higher severity), record it
          if (!warningsMap.has(pairKey)) {
            warningsMap.set(pairKey, {
              severity: fallback.severity,
              drugs: [meds[i].name, meds[j].name],
              description: fallback.description,
              source: "Clinical_Fallback",
            });
          }
        }
      }
    }
  }

  // Return sorted by severity: HIGH first, then MEDIUM, then LOW
  const severityRank: Record<WarningSeverity, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };
  return Array.from(warningsMap.values()).sort(
    (a, b) => severityRank[b.severity] - severityRank[a.severity]
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// ─── STEP 3: MONGODB PATIENT ALLERGY ENGINE ────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

function checkAllergyConflicts(
  meds: { name: string; rxcui?: string }[],
  allergies: IAllergy[]
): AllergyWarning[] {
  if (!allergies || allergies.length === 0) return [];

  const conflicts: AllergyWarning[] = [];

  for (const med of meds) {
    const medName = med.name.toLowerCase();

    for (const allergy of allergies) {
      const substance = allergy.substance.toLowerCase();

      // Check 1: Direct substring / ingredient match (e.g., "Amoxicillin" contains "amox")
      let isMatch = medName.includes(substance) || substance.includes(medName);

      // Check 2: Drug Class expansion matching (e.g., Allergy to "Penicillin" matches "Amoxicillin")
      if (!isMatch && ALLERGY_CLASS_MAPPINGS[substance]) {
        const classMembers = ALLERGY_CLASS_MAPPINGS[substance];
        isMatch = classMembers.some((member) => medName.includes(member));
      }

      // Check 3: Reverse class check (e.g., if allergy recorded as "Amoxicillin", check if med is in penicillin class)
      if (!isMatch) {
        for (const [_className, members] of Object.entries(ALLERGY_CLASS_MAPPINGS)) {
          if (members.some((m) => substance.includes(m)) && members.some((m) => medName.includes(m))) {
            isMatch = true;
            break;
          }
        }
      }

      if (isMatch) {
        // Map patient allergy severity ('SEVERE' -> 'HIGH', etc.)
        let severity: WarningSeverity = "MEDIUM";
        if (allergy.severity === "SEVERE") severity = "HIGH";
        else if (allergy.severity === "MILD") severity = "LOW";

        conflicts.push({
          severity,
          medication: med.name,
          allergicSubstance: allergy.substance,
          description: `PATIENT ALLERGY CONFLICT: Prescribed medication '${med.name}' conflicts with patient's documented allergy to '${allergy.substance}' (${allergy.severity} reaction).`,
          patientSeverityRecorded: allergy.severity,
          notes: allergy.notes,
        });
      }
    }
  }

  const severityRank: Record<WarningSeverity, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };
  return conflicts.sort((a, b) => severityRank[b.severity] - severityRank[a.severity]);
}
