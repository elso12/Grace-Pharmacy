import { Request, Response } from 'express';
import Branch from '../models/Branch.model';

export const getBranches = async (req: Request, res: Response) => {
  try {
    const branches = await Branch.find({ isActive: true }).populate('managerId', 'firstName lastName email');
    res.status(200).json({ success: true, data: branches });
  } catch (error: any) {
    console.error('Error fetching branches:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch branches' });
  }
};

export const createBranch = async (req: Request, res: Response) => {
  try {
    const { name, code, type, address, phone, managerId } = req.body;
    
    // In our system, tenantId is usually inferred from the logged-in user or a default tenant.
    // For simplicity, we'll assume the admin's tenantId if available, or just use a generic ObjectId for now.
    const user = (req as any).user;
    const tenantId = user?.tenantId || "60f7194f9b1d8b3a1c8e4b2d"; // Fallback to a mock ObjectId if needed

    const branch = await Branch.create({
      tenantId,
      name,
      code,
      type,
      address,
      phone,
      managerId
    });
    
    res.status(201).json({ success: true, data: branch });
  } catch (error: any) {
    console.error('Error creating branch:', error);
    if (error.code === 11000) {
       return res.status(400).json({ success: false, message: 'Branch code already exists' });
    }
    res.status(500).json({ success: false, message: 'Failed to create branch' });
  }
};
