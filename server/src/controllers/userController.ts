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
  const { role, status } = req.query;
  const filter: any = { role: { $ne: 'CUSTOMER' } };
  
  if (role) filter.role = role;
  if (status) filter.isActive = status === 'active';

  const users = await User.find(filter).select('-password');
  res.status(200).json({
    status: 'success',
    data: { users }
  });
});

/**
 * @desc    Create a new staff user
 * @route   POST /api/users
 * @access  Private (ADMIN)
 */
export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const { firstName, lastName, email, password, role, phone } = req.body;
  
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('Email is already in use', 400);
  }

  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    role,
    phone,
    isActive: true
  });

  const newUser = user.toObject();
  delete (newUser as any).password;

  res.status(201).json({
    status: 'success',
    data: { user: newUser }
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

  // ── Strict Security Guard: Prevent locking out the last ADMIN ─────────
  if (user.role === 'ADMIN' && user.isActive === true) {
    const activeAdminsCount = await User.countDocuments({ role: 'ADMIN', isActive: true });
    if (activeAdminsCount <= 1) {
      throw new AppError('Security Violation: Cannot deactivate the last remaining Administrator.', 400);
    }
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

/**
 * @desc    Reset user password
 * @route   POST /api/users/:id/reset-password
 * @access  Private (ADMIN)
 */
export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { password } = req.body;
  if (!password || password.length < 6) {
    throw new AppError('Please provide a valid password (min 6 characters)', 400);
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  user.password = password; // Pre-save hook will hash this
  await user.save();

  res.status(200).json({
    status: 'success',
    message: 'Password reset successfully'
  });
});

/**
 * @desc    Delete a user
 * @route   DELETE /api/users/:id
 * @access  Private (ADMIN)
 */
export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // ── Strict Security Guard: Prevent deleting the last ADMIN ───────────
  if (user.role === 'ADMIN') {
    const totalAdminsCount = await User.countDocuments({ role: 'ADMIN' });
    if (totalAdminsCount <= 1) {
      throw new AppError('Security Violation: Cannot delete the primary system Administrator.', 400);
    }
  }

  await User.findByIdAndDelete(req.params.id);

  res.status(200).json({
    status: 'success',
    message: 'User deleted successfully'
  });
});
