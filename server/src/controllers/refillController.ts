import { Request, Response } from 'express';
import Prescription from '../models/Prescription.model';

export const getRefillAlerts = async (req: Request, res: Response) => {
  try {
    // Determine the customer ID
    // In a real application, if it's a Customer portal, req.user would map to a Customer.
    // However, our system seems to have User (for auth) and Customer (for patients).
    // Let's assume the user has an associated Customer record, or we just return all alerts for demo purposes if Admin.
    // For now, we will query active prescriptions that have a dispensedAt date and refills > 0.
    
    // We will dynamically calculate alerts for all prescriptions if no specific customer is requested,
    // or we could filter by customer. We'll return the ones with <= 5 days remaining.
    
    const activePrescriptions = await Prescription.find({
      status: { $in: ['DISPENSED', 'PARTIALLY_DISPENSED'] },
      refillsRemaining: { $gt: 0 }
    }).populate('patient').populate('medications.product');

    const alerts: any[] = [];

    for (const rx of activePrescriptions) {
      if (!rx.dispensedAt) continue;

      for (const item of rx.medications) {
        let daysSupply = 30;
        const durationMatch = item.duration.match(/(\d+)\s*(day|week|month)/i);
        if (durationMatch) {
          const num = parseInt(durationMatch[1], 10);
          const unit = durationMatch[2].toLowerCase();
          if (unit.startsWith('day')) daysSupply = num;
          if (unit.startsWith('week')) daysSupply = num * 7;
          if (unit.startsWith('month')) daysSupply = num * 30;
        }

        const dispensedDate = new Date(rx.dispensedAt);
        const depletionDate = new Date(dispensedDate.getTime() + (daysSupply * 24 * 60 * 60 * 1000));
        
        const today = new Date();
        const diffTime = depletionDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 5 && diffDays >= 0) {
          const patient = rx.patient as any;
          const product = item.product as any;
          const productName = product?.name || 'Medication';
          
          alerts.push({
            prescriptionId: rx._id,
            patientName: patient.fullName || patient.firstName,
            medication: productName,
            daysRemaining: diffDays,
            refillsRemaining: rx.refillsRemaining,
            message: `🔔 Hi ${patient.firstName}, your ${daysSupply}-day supply of ${productName} is ending in ${diffDays} days. Click here to request a 1-click refill.`
          });
        }
      }
    }

    return res.status(200).json({ success: true, data: alerts });
  } catch (error: any) {
    console.error('Error fetching refill alerts:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch refill alerts' });
  }
};
