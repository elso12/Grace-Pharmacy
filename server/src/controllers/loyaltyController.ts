import { Request, Response } from 'express';
import User from '../models/User.model';

/**
 * Redeem loyalty points
 */
export const redeemPoints = async (req: Request, res: Response) => {
  try {
    const customerId = (req as any).user.id;
    const { pointsToRedeem } = req.body; // e.g., 100 points

    if (!pointsToRedeem || pointsToRedeem < 100 || pointsToRedeem % 100 !== 0) {
      return res.status(400).json({ success: false, message: 'Points to redeem must be a multiple of 100' });
    }

    const customer = await User.findById(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    if (customer.loyaltyPoints < pointsToRedeem) {
      return res.status(400).json({ success: false, message: 'Insufficient loyalty points' });
    }

    // Deduct points
    customer.loyaltyPoints -= pointsToRedeem;
    await customer.save();

    // 100 points = $5 discount
    const discountAmount = (pointsToRedeem / 100) * 5;

    return res.status(200).json({
      success: true,
      message: `Redeemed ${pointsToRedeem} points for a $${discountAmount} discount`,
      data: {
        loyaltyPointsRemaining: customer.loyaltyPoints,
        discountAmount
      }
    });
  } catch (error: any) {
    console.error('Error redeeming points:', error);
    return res.status(500).json({ success: false, message: 'Failed to redeem points' });
  }
};

/**
 * Get customer loyalty points
 */
export const getLoyaltyBalance = async (req: Request, res: Response) => {
  try {
    const customerId = (req as any).user.id;
    const customer = await User.findById(customerId);
    
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    return res.status(200).json({
      success: true,
      data: {
        loyaltyPoints: customer.loyaltyPoints || 0
      }
    });
  } catch (error: any) {
    console.error('Error fetching loyalty balance:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch loyalty balance' });
  }
};
