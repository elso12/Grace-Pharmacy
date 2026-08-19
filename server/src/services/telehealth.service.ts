import Consultation, { ConsultStatus } from '../models/Consultation.model';
import mongoose from 'mongoose';

/**
 * Service to manage Telehealth Medication Therapy Management (MTM).
 */

export interface StartConsultRequest {
  consultationId: string;
  pharmacistId: string;
}

export const startConsultation = async (req: StartConsultRequest) => {
  const consult = await Consultation.findOneAndUpdate(
    { _id: req.consultationId, pharmacistId: req.pharmacistId },
    { status: ConsultStatus.IN_PROGRESS, startedAt: new Date() },
    { new: true }
  );

  if (!consult) {
    throw new Error('Consultation not found or unauthorized.');
  }

  // Generate ephemeral WebRTC room token here if implementing real-time video stack
  const roomToken = `webrtc_room_${consult._id}_${Date.now()}`;
  consult.meetingLink = `https://telehealth.pharmacy.internal/room/${roomToken}`;
  await consult.save();

  return consult;
};

export interface SubmitNotesRequest {
  consultationId: string;
  pharmacistId: string;
  notes: {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
  };
}

/**
 * Submits clinical SOAP notes and concludes the consultation.
 */
export const completeConsultation = async (req: SubmitNotesRequest) => {
  const consult = await Consultation.findOneAndUpdate(
    { _id: req.consultationId, pharmacistId: req.pharmacistId },
    { 
      clinicalNotes: req.notes,
      status: ConsultStatus.COMPLETED,
      endedAt: new Date()
    },
    { new: true }
  );

  if (!consult) {
    throw new Error('Consultation not found or unauthorized.');
  }

  // Here, we would trigger an event to sync these notes to the patient's centralized EHR profile
  console.log(`[Telehealth] Pushing SOAP notes to EHR for Patient ${consult.patientId}`);

  return consult;
};
