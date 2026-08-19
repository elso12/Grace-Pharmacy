import InsurancePlan, { FormularyTier } from '../models/InsurancePlan.model';
import Product from '../models/Product.model';

export interface AdjudicationRequest {
  patientId: string;
  insurancePlanId: string;
  memberId: string;
  cartItems: { productId: string; quantity: number; unitPrice: number }[];
}

export interface AdjudicationResponse {
  totalCost: number;
  coveredAmount: number;
  patientCoPay: number;
  isApproved: boolean;
  rejectionReason?: string;
  lineItems: {
    productId: string;
    tier: FormularyTier;
    grossCost: number;
    covered: number;
    patientResp: number;
  }[];
}

/**
 * Service to simulate real-time insurance adjudication logic.
 */
export const adjudicateClaim = async (request: AdjudicationRequest): Promise<AdjudicationResponse> => {
  const plan = await InsurancePlan.findById(request.insurancePlanId);
  if (!plan) {
    throw new Error('Insurance Plan not found or invalid.');
  }

  if (!plan.isActive) {
    return {
      totalCost: 0, coveredAmount: 0, patientCoPay: 0, isApproved: false,
      rejectionReason: 'Insurance Plan inactive.', lineItems: []
    };
  }

  let totalCost = 0;
  let coveredAmount = 0;
  let patientCoPay = 0;
  const lineItems = [];

  for (const item of request.cartItems) {
    const product = await Product.findById(item.productId);
    if (!product) continue;
    
    // Simulate determining formulary tier (usually this comes from a massive PBM database mapping NDCs)
    // For this mock, we assume genericName similarity dictates tier 1. 
    // Otherwise tier 2/3 randomly based on if it's a specialty drug.
    let tier: FormularyTier = FormularyTier.TIER_2_PREFERRED_BRAND;
    if (product.genericName.toLowerCase() === product.name.toLowerCase()) {
      tier = FormularyTier.TIER_1_GENERIC; // True generics
    } else if (product.requiresPrescription && item.unitPrice > 200) {
      tier = FormularyTier.TIER_4_SPECIALTY;
    }

    const grossCost = item.quantity * item.unitPrice;
    
    // Apply copay logic based on Tier
    const fixedCopay = plan.tierCopays[tier] || 0;
    
    // If the actual cost is less than the fixed copay, patient just pays actual cost
    const patientResp = Math.min(grossCost, fixedCopay);
    const covered = grossCost - patientResp;

    totalCost += grossCost;
    patientCoPay += patientResp;
    coveredAmount += covered;

    lineItems.push({
      productId: item.productId,
      tier,
      grossCost,
      covered,
      patientResp
    });
  }

  return {
    isApproved: true,
    totalCost,
    coveredAmount,
    patientCoPay,
    lineItems
  };
};
