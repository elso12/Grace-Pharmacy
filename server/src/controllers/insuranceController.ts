import { Request, Response } from 'express';
import InsuranceClaim from '../models/InsuranceClaim.model';

/**
 * Get all insurance claims with optional filters
 */
export const getClaims = async (req: Request, res: Response) => {
  try {
    const { status, provider } = req.query;
    const filter: any = {};
    if (status) filter.status = status;
    if (provider) filter.insuranceProvider = provider;

    const claims = await InsuranceClaim.find(filter).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: claims });
  } catch (error: any) {
    console.error('Error fetching claims:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch insurance claims' });
  }
};

/**
 * Submit a new claim
 */
export const submitClaim = async (req: Request, res: Response) => {
  try {
    // In a real scenario, this would be generated automatically from an order or prescription checkout
    const claimData = req.body;
    
    // Auto-generate claim number if not provided
    if (!claimData.claimNumber) {
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
      claimData.claimNumber = `CLM-${timestamp}-${randomStr}`;
    }

    const newClaim = new InsuranceClaim(claimData);
    await newClaim.save();

    return res.status(201).json({ success: true, message: 'Claim submitted successfully', data: newClaim });
  } catch (error: any) {
    console.error('Error submitting claim:', error);
    return res.status(500).json({ success: false, message: 'Failed to submit insurance claim' });
  }
};

/**
 * Adjudicate a claim
 */
export const adjudicateClaim = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, approvedAmount, rejectionReason, remittanceCode } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }

    const claim = await InsuranceClaim.findById(id);
    if (!claim) {
      return res.status(404).json({ success: false, message: 'Claim not found' });
    }

    claim.status = status;
    claim.adjudicatedAt = new Date();
    
    if (status === 'REJECTED') {
      claim.rejectionReason = rejectionReason;
    } else {
      if (approvedAmount !== undefined) claim.insuranceCoveredAmount = approvedAmount;
      if (remittanceCode) claim.remittanceCode = remittanceCode;
    }

    await claim.save();

    return res.status(200).json({ success: true, message: 'Claim adjudicated successfully', data: claim });
  } catch (error: any) {
    console.error('Error adjudicating claim:', error);
    return res.status(500).json({ success: false, message: 'Failed to adjudicate claim' });
  }
};

/**
 * Get Insurance Summary Metrics
 */
export const getInsuranceSummary = async (req: Request, res: Response) => {
  try {
    const claims = await InsuranceClaim.find();

    let totalPendingReceivables = 0;
    let totalPaidClaimsAmount = 0;
    let rejectedCount = 0;
    let totalCount = claims.length;

    claims.forEach(claim => {
      if (claim.status === 'PENDING_ADJUDICATION' || claim.status === 'SUBMITTED') {
        totalPendingReceivables += claim.insuranceCoveredAmount; // The amount we expect
      } else if (claim.status === 'APPROVED_PAID' || claim.status === 'PARTIALLY_PAID') {
        totalPaidClaimsAmount += claim.insuranceCoveredAmount;
      } else if (claim.status === 'REJECTED') {
        rejectedCount++;
      }
    });

    const rejectionRate = totalCount > 0 ? (rejectedCount / totalCount) * 100 : 0;

    return res.status(200).json({
      success: true,
      data: {
        totalPendingReceivables,
        totalPaidClaims: totalPaidClaimsAmount, // total $ amount reimbursed
        rejectionRate,
        totalClaims: totalCount
      }
    });
  } catch (error: any) {
    console.error('Error fetching insurance summary:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch insurance summary' });
  }
};
