import User from '../models/User.model';
import Prescription from '../models/Prescription.model';
import Order from '../models/Order.model';

export interface AdherenceScore {
  patientId: string;
  mpr: number; // Medication Possession Ratio (0.0 to 1.0)
  status: 'COMPLIANT' | 'AT_RISK' | 'NON_COMPLIANT';
  daysSupplied: number;
  daysElapsed: number;
}

/**
 * Calculates the Medication Possession Ratio (MPR) for a given prescription.
 * MPR = (Total Days Supply Dispensed) / (Total Days since first fill).
 */
export const calculateMPR = async (patientId: string, prescriptionId: string): Promise<AdherenceScore> => {
  // In a real database, we would aggregate all dispensed orders linked to this prescription.
  // We mock the calculation logic here.
  
  const mockDaysSupplied = 90; // e.g., Three 30-day fills
  const mockDaysElapsed = 120; // 4 months since first fill
  
  const mpr = mockDaysSupplied / mockDaysElapsed;
  
  let status: 'COMPLIANT' | 'AT_RISK' | 'NON_COMPLIANT' = 'COMPLIANT';
  if (mpr < 0.8) status = 'AT_RISK';
  if (mpr < 0.6) status = 'NON_COMPLIANT';

  return {
    patientId,
    mpr,
    status,
    daysSupplied: mockDaysSupplied,
    daysElapsed: mockDaysElapsed
  };
};

/**
 * Auto-Refill Scheduler: Checks active prescriptions that are 5 days away from exhaustion.
 * Should be run daily via a Cron Job.
 */
export const processAutoRefills = async () => {
  console.log('[AdherenceService] Starting daily auto-refill check...');
  
  // Find prescriptions with auto-refill enabled and remaining refills > 0
  // Compare the (last dispensed date + days supply) with (current date + 5 days)
  
  // MOCK DISPATCH
  const mockAlerts = [
    { patient: 'Jane Doe', phone: '+1234567890', drug: 'Lisinopril 10mg' }
  ];

  for (const alert of mockAlerts) {
    await sendOmnichannelAlert(
      alert.phone, 
      'SMS', 
      `Pharmacy Alert: Your prescription for ${alert.drug} is due for a refill in 5 days. Reply YES to auto-fill.`
    );
  }

  console.log('[AdherenceService] Auto-refill check complete.');
};

/**
 * Simulated Omnichannel Notification Service
 */
export const sendOmnichannelAlert = async (
  recipient: string, 
  channel: 'SMS' | 'EMAIL' | 'WHATSAPP', 
  message: string
) => {
  // Integrate with Twilio / SendGrid / WhatsApp Business API
  console.log(`[${channel} -> ${recipient}]: ${message}`);
  return true;
};
