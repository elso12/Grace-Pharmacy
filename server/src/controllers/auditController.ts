import { Request, Response } from 'express';
import { asyncHandler } from '../utils/errors';
import AuditLog from '../models/AuditLog.model';

/**
 * @desc    Get all audit logs
 * @route   GET /api/audit
 * @access  Private (ADMIN)
 */
export const getAuditLogs = asyncHandler(async (req: Request, res: Response) => {
  const { action, entityType, limit = 50, page = 1 } = req.query;

  const filter: any = {};
  if (action) filter.action = action;
  if (entityType) filter.entityType = entityType;

  const skip = (Number(page) - 1) * Number(limit);

  const logs = await AuditLog.find(filter)
    .populate('performedBy', 'firstName lastName email role')
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(Number(limit))
    .lean();

  const total = await AuditLog.countDocuments(filter);

  res.status(200).json({
    status: 'success',
    data: { 
      logs, 
      pagination: { 
        total, 
        page: Number(page), 
        limit: Number(limit) 
      } 
    }
  });
});
