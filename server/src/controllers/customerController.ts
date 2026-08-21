import { Request, Response } from 'express';
import Customer from '../models/Customer.model';
import User from '../models/User.model';
import Prescription from '../models/Prescription.model';
import { asyncHandler } from '../utils/errors';

/**
 * GET /api/customers/profile
 * Retrieves the authenticated user's customer profile.
 * If one does not exist, it creates a basic profile using the User's details.
 */
export const getProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!._id;
  const user = await User.findById(userId);
  
  if (!user) {
    res.status(404).json({ status: 'error', message: 'User not found' });
    return;
  }

  // Find customer by email or phone
  let customer = await Customer.findOne({
    $or: [{ email: user.email }, { phone: user.phone }]
  }).populate('prescriptions');

  if (!customer) {
    // Auto-create customer profile
    customer = await Customer.create({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone || '0000000000', // Provide default if User has no phone
      isActive: true,
    });
  }

  // Also manually fetch prescriptions linked to this customer just in case they aren't synced in the array
  const prescriptions = await Prescription.find({ patient: customer._id }).sort({ createdAt: -1 }).populate('medications.product', 'name strength');

  res.status(200).json({
    status: 'success',
    data: {
      profile: customer,
      prescriptions,
    },
  });
});

/**
 * PUT /api/customers/profile
 * Updates the authenticated user's customer profile.
 */
export const updateProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!._id;
  const user = await User.findById(userId);

  if (!user) {
    res.status(404).json({ status: 'error', message: 'User not found' });
    return;
  }

  const { address, phone, allergies, medicalConditions } = req.body;

  let customer = await Customer.findOne({
    $or: [{ email: user.email }, { phone: user.phone }]
  });

  if (!customer) {
    res.status(404).json({ status: 'error', message: 'Customer profile not found' });
    return;
  }

  if (address) customer.address = address;
  if (phone) customer.phone = phone;
  if (allergies) customer.allergies = allergies;
  if (medicalConditions) customer.medicalConditions = medicalConditions;

  await customer.save();

  res.status(200).json({
    status: 'success',
    message: 'Profile updated successfully',
    data: customer,
  });
});
