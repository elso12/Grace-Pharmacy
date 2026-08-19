/**
 * Mock OCR Service for Clinical Prescriptions
 * 
 * In a full production environment, this would interface with Google Cloud Vision API 
 * or OpenAI GPT-4o Vision to extract text from a physical prescription image.
 */

interface ParsedPrescription {
  patientDetails: { name: string; dob?: string };
  prescriberDetails: { name: string; license?: string; npi?: string; dea?: string };
  medication: {
    name: string;
    strength: string;
    form: string;
    quantity: number;
    refills: number;
  };
  sig: {
    raw: string;
    translated: string;
  };
}

// Common Latin Medical Abbreviations (Sig Codes)
const sigDictionary: Record<string, string> = {
  'PO': 'by mouth',
  'PRN': 'as needed',
  'Q': 'every',
  'QD': 'every day',
  'BID': 'twice a day',
  'TID': 'three times a day',
  'QID': 'four times a day',
  'QHS': 'at bedtime',
  'Q4H': 'every 4 hours',
  'Q6H': 'every 6 hours',
  'Q8H': 'every 8 hours',
  'T': 'tablet',
  'C': 'capsule',
  'DROP': 'drop',
  'GTT': 'drop',
  'UD': 'as directed',
};

/**
 * Translates a raw latin sig code string into patient-friendly instructions.
 * E.g., "1 T PO QID PRN" -> "Take 1 tablet by mouth four times a day as needed"
 */
export const translateSigCode = (rawSig: string): string => {
  const parts = rawSig.toUpperCase().split(' ');
  const translatedParts = parts.map(part => {
    // Exact match
    if (sigDictionary[part]) return sigDictionary[part];
    
    // Check for numbers (e.g., "1")
    if (!isNaN(Number(part))) return part;

    // Check if it starts with Q and ends with H (e.g., Q12H)
    if (part.startsWith('Q') && part.endsWith('H') && part.length > 2) {
      const hours = part.substring(1, part.length - 1);
      if (!isNaN(Number(hours))) return `every ${hours} hours`;
    }

    return part; // Return as-is if no translation found
  });

  // Basic sentence construction
  let instruction = translatedParts.join(' ');
  
  // Prefix with 'Take' or 'Apply' based on context if not present, simple heuristic
  if (/tablet|capsule|by mouth/i.test(instruction) && !/^take/i.test(instruction)) {
    instruction = `Take ${instruction}`;
  }

  return instruction;
};

/**
 * Mocks the extraction of prescription data from an image file.
 */
export const extractPrescriptionFromImage = async (base64Image: string): Promise<ParsedPrescription> => {
  // Simulate AI Vision API processing time
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // In reality, this would parse the OCR text payload. 
  // We mock a highly complex extraction here.
  const rawSig = '1 T PO QID PRN';
  
  return {
    patientDetails: { name: 'John Doe', dob: '1980-05-15' },
    prescriberDetails: { name: 'Dr. Gregory House', npi: '1234567890', dea: 'XY1234567' },
    medication: {
      name: 'Amoxicillin',
      strength: '500mg',
      form: 'Tablet',
      quantity: 30,
      refills: 2,
    },
    sig: {
      raw: rawSig,
      translated: translateSigCode(rawSig),
    },
  };
};
