import { Request, Response } from 'express';
import { asyncHandler, AppError } from '../utils/errors';
import Supplier from '../models/Supplier.model';

/**
 * @desc    Get all suppliers (with optional search & filter)
 * @route   GET /api/suppliers
 * @access  Private (ADMIN)
 */
export const getSuppliers = asyncHandler(async (req: Request, res: Response) => {
  const { search, status } = req.query;
  const filter: any = {};

  if (status === 'active') filter.isActive = true;
  if (status === 'inactive') filter.isActive = false;

  if (search && typeof search === 'string') {
    const regex = new RegExp(search, 'i');
    filter.$or = [
      { name: regex },
      { contactPerson: regex },
      { email: regex },
      { licenseNumber: regex },
    ];
  }

  const suppliers = await Supplier.find(filter).sort({ name: 1 });

  res.status(200).json({
    status: 'success',
    results: suppliers.length,
    data: { suppliers },
  });
});

/**
 * @desc    Get single supplier by ID
 * @route   GET /api/suppliers/:id
 * @access  Private (ADMIN)
 */
export const getSupplierById = asyncHandler(async (req: Request, res: Response) => {
  const supplier = await Supplier.findById(req.params.id);
  if (!supplier) {
    throw new AppError('Supplier not found', 404);
  }

  res.status(200).json({
    status: 'success',
    data: { supplier },
  });
});

/**
 * @desc    Create a new supplier
 * @route   POST /api/suppliers
 * @access  Private (ADMIN)
 */
export const createSupplier = asyncHandler(async (req: Request, res: Response) => {
  const { name, contactPerson, email, phone, address, licenseNumber, paymentTerms, notes } = req.body;

  const supplier = await Supplier.create({
    name,
    contactPerson,
    email,
    phone,
    address,
    licenseNumber,
    paymentTerms,
    notes,
  });

  res.status(201).json({
    status: 'success',
    data: { supplier },
  });
});

/**
 * @desc    Update an existing supplier
 * @route   PUT /api/suppliers/:id
 * @access  Private (ADMIN)
 */
export const updateSupplier = asyncHandler(async (req: Request, res: Response) => {
  const supplier = await Supplier.findById(req.params.id);
  if (!supplier) {
    throw new AppError('Supplier not found', 404);
  }

  const { name, contactPerson, email, phone, address, licenseNumber, paymentTerms, isActive, notes } = req.body;

  supplier.name = name ?? supplier.name;
  supplier.contactPerson = contactPerson ?? supplier.contactPerson;
  supplier.email = email ?? supplier.email;
  supplier.phone = phone ?? supplier.phone;
  supplier.address = address ?? supplier.address;
  supplier.licenseNumber = licenseNumber ?? supplier.licenseNumber;
  supplier.paymentTerms = paymentTerms ?? supplier.paymentTerms;
  if (isActive !== undefined) supplier.isActive = isActive;
  supplier.notes = notes ?? supplier.notes;

  await supplier.save();

  res.status(200).json({
    status: 'success',
    data: { supplier },
  });
});

/**
 * @desc    Delete a supplier
 * @route   DELETE /api/suppliers/:id
 * @access  Private (ADMIN)
 */
export const deleteSupplier = asyncHandler(async (req: Request, res: Response) => {
  const supplier = await Supplier.findById(req.params.id);
  if (!supplier) {
    throw new AppError('Supplier not found', 404);
  }

  await supplier.deleteOne();

  res.status(200).json({
    status: 'success',
    message: 'Supplier deleted successfully',
  });
});
