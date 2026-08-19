import Prescription from '../models/Prescription.model';
import User from '../models/User.model';

/**
 * Maps an internal Prescription record to a standard FHIR R4 MedicationRequest Resource.
 * This is used for answering API requests from Hospital EHRs (Epic, Cerner).
 */
export const mapToFHIRMedicationRequest = async (prescriptionId: string) => {
  const rx = await Prescription.findById(prescriptionId)
    .populate('patient')
    .populate('medications.product');

  if (!rx) {
    throw new Error('Prescription not found');
  }

  const patient = rx.patient as any;

  // Build FHIR R4 MedicationRequest JSON
  const fhirResource = {
    resourceType: "MedicationRequest",
    id: rx._id.toString(),
    identifier: [
      {
        system: "http://pharmacy.internal/prescriptions",
        value: rx.prescriptionNumber
      }
    ],
    status: mapPrescriptionStatusToFHIR(rx.status),
    intent: "order",
    medicationCodeableConcept: {
      coding: rx.medications.map((item: any) => {
        const prod = item.product as any;
        return {
          system: "http://hl7.org/fhir/sid/ndc",
          code: prod.sku, // Mocking SKU as NDC
          display: prod.name
        };
      })
    },
    subject: {
      reference: `Patient/${patient._id}`,
      display: patient.fullName
    },
    authoredOn: rx.createdAt.toISOString(),
    requester: {
      display: rx.doctor.name
    },
    dosageInstruction: rx.medications.map((item: any) => ({
      text: `${item.dosage} ${item.frequency} for ${item.duration}`,
      patientInstruction: item.notes
    })),
    dispenseRequest: {
      quantity: {
        value: rx.medications.reduce((acc: number, curr: any) => acc + curr.quantity, 0),
        unit: "TAB"
      }
    }
  };

  return fhirResource;
};

/**
 * Helper to map internal enum to FHIR standard status
 */
const mapPrescriptionStatusToFHIR = (internalStatus: string): string => {
  switch (internalStatus) {
    case 'PENDING':
    case 'IN_REVIEW':
      return 'draft';
    case 'APPROVED_WITH_NOTES':
      return 'active';
    case 'REJECTED':
    case 'CANCELLED':
      return 'cancelled';
    case 'DISPENSED':
      return 'completed';
    default:
      return 'unknown';
  }
};
