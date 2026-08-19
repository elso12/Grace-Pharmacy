import { Request, Response } from 'express';
import { asyncHandler, AppError } from '../utils/errors';
import User from '../models/User.model';
import mongoose from 'mongoose';

/**
 * @desc    Get all staff users
 * @route   GET /api/users
 * @access  Private (ADMIN)
 */
export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const users = await User.find({ role: { $ne: 'CUSTOMER' } }).select('-password');
  res.status(200).json({
    status: 'success',
    data: { users }
  });
});

/**
 * @desc    Get a single user by ID
 * @route   GET /api/users/:id
 * @access  Private (ADMIN)
 */
export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) {
    throw new AppError('User not found', 404);
  }
  res.status(200).json({
    status: 'success',
    data: { user }
  });
});

/**
 * @desc    Update a user
 * @route   PUT /api/users/:id
 * @access  Private (ADMIN)
 */
export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const { firstName, lastName, email, role, isActive, phone } = req.body;

  const user = await User.findById(req.params.id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Prevent an admin from disabling themselves or changing their own role
  if (user.id === (req as any).user.id) {
    if (role && role !== user.role) {
      throw new AppError('You cannot change your own role', 400);
    }
    if (isActive !== undefined && isActive !== user.isActive) {
      throw new AppError('You cannot change your own active status', 400);
    }
  }

  user.firstName = firstName || user.firstName;
  user.lastName = lastName || user.lastName;
  user.email = email || user.email;
  user.role = role || user.role;
  if (isActive !== undefined) user.isActive = isActive;
  user.phone = phone || user.phone;

  await user.save();

  // Exclude password from response
  const updatedUser = user.toObject();
  delete (updatedUser as any).password;

  res.status(200).json({
    status: 'success',
    data: { user: updatedUser }
  });
});

/**
 * @desc    Toggle user active status
 * @route   PATCH /api/users/:id/status
 * @access  Private (ADMIN)
 */
export const toggleUserStatus = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (user.id === (req as any).user.id) {
    throw new AppError('You cannot disable your own account', 400);
  }

  user.isActive = !user.isActive;
  await user.save();

  const updatedUser = user.toObject();
  delete (updatedUser as any).password;

  res.status(200).json({
    status: 'success',
    data: { user: updatedUser }
  });
});
