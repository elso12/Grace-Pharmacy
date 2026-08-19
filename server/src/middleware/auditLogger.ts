import mongoose from 'mongoose';
import { Request, Response, NextFunction } from 'express';
import AuditLog, { AuditAction } from '../models/AuditLog.model';

export const auditLogger = (req: Request, res: Response, next: NextFunction) => {
  // Only log mutating requests
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    // Intercept the response to log after it finishes
    res.on('finish', async () => {
      // Only log successful or client-error mutations, skip 500s or skip if we want
      if (res.statusCode >= 200 && res.statusCode < 400) {
        try {
          const user = (req as any).user; // Set by protect middleware
          let action = AuditAction.UPDATE;
          if (req.method === 'POST') action = AuditAction.CREATE;
          if (req.method === 'DELETE') action = AuditAction.DELETE;

          // Attempt to determine entity type from route
          const routePath = req.baseUrl || req.path;
          const entityParts = routePath.split('/').filter(p => p && p !== 'api');
          const entityType = entityParts.length > 0 ? entityParts[0].toUpperCase() : 'UNKNOWN';

          // Sanitize body (remove passwords)
          const newState = { ...req.body };
          if (newState.password) delete newState.password;
          
          let entityId = null;
          if (req.params.id && mongoose.Types.ObjectId.isValid(req.params.id)) {
             entityId = new mongoose.Types.ObjectId(req.params.id);
          } else {
             entityId = new mongoose.Types.ObjectId(); // Fallback to satisfy required constraint
          }

          await AuditLog.create({
            action,
            entityType,
            entityId,
            performedBy: user?.id,
            newState,
            ipAddress: req.ip,
            timestamp: new Date(),
          });
        } catch (error) {
          console.error('Audit Logger Error:', error);
        }
      }
    });
  }
  next();
};
