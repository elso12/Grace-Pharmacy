import { Request, Response, NextFunction } from 'express';
import Alert, { AlertStatus } from '../models/Alert.model';

export const getAlerts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status } = req.query;
    const filter: any = {};
    if (status) {
      filter.status = status;
    } else {
      // Default to unresolved alerts
      filter.status = AlertStatus.UNRESOLVED;
    }

    const alerts = await Alert.find(filter).sort({ priority: -1, createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: alerts.length,
      data: alerts,
    });
  } catch (error) {
    next(error);
  }
};

export const updateAlertStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const alert = await Alert.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!alert) {
      res.status(404).json({ status: 'fail', message: 'Alert not found' });
      return;
    }

    res.status(200).json({
      status: 'success',
      data: alert,
    });
  } catch (error) {
    next(error);
  }
};
