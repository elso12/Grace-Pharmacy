import MasterFormula, { FormulationType } from '../models/MasterFormula.model';

export interface CompoundingResult {
  formulaId: string;
  totalCost: number;
  recommendedPrice: number;
  beyondUseDate: Date; // BUD based on USP <795> or <797>
}

/**
 * Service to manage Extemporaneous Formulation logic.
 */
export const calculateCompoundingBatch = async (formulaId: string): Promise<CompoundingResult> => {
  const formula = await MasterFormula.findById(formulaId);
  if (!formula) {
    throw new Error('Master Formula not found.');
  }

  // 1. Calculate Costs
  // In a real system, we'd iterate formula.ingredients, fetch the current InventoryBatch average cost per unit, and sum it.
  const chemicalCost = formula.baseCost > 0 ? formula.baseCost : 25.50; // Mock chemical cost
  const laborCostPerMinute = 1.50; // $90/hr pharmacist rate
  const laborCost = formula.laborTimeMinutes * laborCostPerMinute;
  
  const totalCost = chemicalCost + laborCost;
  const recommendedPrice = totalCost * 2.5; // 150% markup for compounded meds

  // 2. Calculate Beyond-Use Date (BUD)
  let budDays = 14; // Default safe fallback
  
  const today = new Date();
  const bud = new Date(today);

  // Simplified USP <795> (Non-Sterile) and <797> (Sterile) heuristics
  if (formula.type === FormulationType.NON_STERILE_ORAL) {
    if (formula.waterActivityAmount > 0.6) {
      budDays = formula.containsPreservative ? 35 : 14; // Water-containing oral formulations
    } else {
      budDays = 90; // Non-aqueous formulations
    }
  } else if (formula.type === FormulationType.NON_STERILE_TOPICAL) {
    budDays = formula.waterActivityAmount > 0.6 ? 30 : 90;
  } else if (formula.type === FormulationType.STERILE_IV) {
    budDays = 9; // E.g., medium risk at room temp (USP <797> is highly complex, mocking 9 days)
  }

  bud.setDate(today.getDate() + budDays);

  return {
    formulaId,
    totalCost,
    recommendedPrice,
    beyondUseDate: bud,
  };
};
