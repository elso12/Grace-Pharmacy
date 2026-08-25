import { Request, Response } from 'express';
import Timesheet, { TimesheetStatus } from '../models/Timesheet.model';

export const clockIn = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    // Check if there is already an active shift
    const activeShift = await Timesheet.findOne({ staffId: user._id, status: TimesheetStatus.ACTIVE });
    if (activeShift) {
      return res.status(400).json({ success: false, message: 'You are already clocked in' });
    }

    let hourlyRate = 18.0; // Default
    if (user.role === 'PHARMACIST') hourlyRate = 45.0;
    if (user.role === 'TECHNICIAN') hourlyRate = 25.0;
    if (user.role === 'ADMIN') hourlyRate = 50.0;

    const timesheet = await Timesheet.create({
      staffId: user._id,
      staffName: `${user.firstName} ${user.lastName}`,
      role: user.role,
      clockIn: new Date(),
      hourlyRate,
      status: TimesheetStatus.ACTIVE,
    });

    res.status(201).json({ success: true, data: timesheet });
  } catch (error: any) {
    console.error('Error clocking in:', error);
    res.status(500).json({ success: false, message: 'Failed to clock in' });
  }
};

export const clockOut = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    const timesheet = await Timesheet.findOne({ staffId: user._id, status: TimesheetStatus.ACTIVE });
    if (!timesheet) {
      return res.status(404).json({ success: false, message: 'No active shift found' });
    }

    const clockOutTime = new Date();
    const clockInTime = new Date(timesheet.clockIn);
    
    const diffMs = clockOutTime.getTime() - clockInTime.getTime();
    const totalHours = diffMs / (1000 * 60 * 60);

    const overtimeHours = totalHours > 8 ? totalHours - 8 : 0;
    const regularHours = totalHours > 8 ? 8 : totalHours;

    timesheet.clockOut = clockOutTime;
    timesheet.totalHours = parseFloat(totalHours.toFixed(2));
    timesheet.overtimeHours = parseFloat(overtimeHours.toFixed(2));
    timesheet.status = TimesheetStatus.COMPLETED;

    await timesheet.save();

    res.status(200).json({ success: true, data: timesheet });
  } catch (error: any) {
    console.error('Error clocking out:', error);
    res.status(500).json({ success: false, message: 'Failed to clock out' });
  }
};

export const getMyShifts = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const timesheets = await Timesheet.find({ staffId: user._id }).sort({ clockIn: -1 });
    res.status(200).json({ success: true, data: timesheets });
  } catch (error: any) {
    console.error('Error fetching shifts:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch shifts' });
  }
};

export const getAllTimesheets = async (req: Request, res: Response) => {
  try {
    const timesheets = await Timesheet.find().sort({ clockIn: -1 });
    res.status(200).json({ success: true, data: timesheets });
  } catch (error: any) {
    console.error('Error fetching all timesheets:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch timesheets' });
  }
};

export const approveTimesheet = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const timesheet = await Timesheet.findById(id);
    if (!timesheet) {
      return res.status(404).json({ success: false, message: 'Timesheet not found' });
    }

    if (timesheet.status !== TimesheetStatus.COMPLETED) {
      return res.status(400).json({ success: false, message: 'Only completed timesheets can be approved' });
    }

    timesheet.status = TimesheetStatus.APPROVED;
    await timesheet.save();

    res.status(200).json({ success: true, data: timesheet });
  } catch (error: any) {
    console.error('Error approving timesheet:', error);
    res.status(500).json({ success: false, message: 'Failed to approve timesheet' });
  }
};

export const getPayrollSummary = async (req: Request, res: Response) => {
  try {
    const timesheets = await Timesheet.find({ status: { $in: [TimesheetStatus.COMPLETED, TimesheetStatus.APPROVED] } });
    
    let totalRegularHours = 0;
    let totalOvertimeHours = 0;
    let totalPayrollExpense = 0;

    timesheets.forEach(t => {
      const regularHours = t.totalHours - t.overtimeHours;
      totalRegularHours += regularHours;
      totalOvertimeHours += t.overtimeHours;
      
      const regularPay = regularHours * t.hourlyRate;
      const overtimePay = t.overtimeHours * (t.hourlyRate * 1.5);
      totalPayrollExpense += regularPay + overtimePay;
    });

    res.status(200).json({
      success: true,
      data: {
        totalRegularHours: parseFloat(totalRegularHours.toFixed(2)),
        totalOvertimeHours: parseFloat(totalOvertimeHours.toFixed(2)),
        totalPayrollExpense: parseFloat(totalPayrollExpense.toFixed(2)),
      }
    });
  } catch (error: any) {
    console.error('Error calculating payroll summary:', error);
    res.status(500).json({ success: false, message: 'Failed to calculate payroll summary' });
  }
};
