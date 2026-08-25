/**
 * Thermal Label & Receipt Generation Service
 */

interface LabelData {
  patientName?: string;
  medicationName: string;
  strength?: string;
  dosageInstructions?: string;
  batchNumber: string;
  expiryDate: string;
  dispenseDate: string;
  pharmacyName?: string;
  pharmacyPhone?: string;
}

export const printMedicationLabel = (data: LabelData) => {
  const pharmacyName = data.pharmacyName || 'Grace Pharmacy';
  const pharmacyPhone = data.pharmacyPhone || '+1 (555) 123-4567';
  
  // Format dates
  const expiry = new Date(data.expiryDate).toLocaleDateString();
  const dispensed = new Date(data.dispenseDate).toLocaleDateString();

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Medication Label</title>
      <style>
        @page {
          margin: 0;
          size: 2.25in 1.25in; /* Standard direct thermal label size */
        }
        body {
          margin: 0;
          padding: 0.1in;
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          width: 2.05in;
          height: 1.05in;
          box-sizing: border-box;
          background-color: white;
          color: black;
          display: flex;
          flex-direction: column;
        }
        .header {
          text-align: center;
          border-bottom: 1px solid black;
          padding-bottom: 2px;
          margin-bottom: 4px;
        }
        .header h1 {
          font-size: 8pt;
          font-weight: bold;
          margin: 0;
        }
        .header p {
          font-size: 6pt;
          margin: 0;
        }
        .patient {
          font-size: 8pt;
          font-weight: bold;
          margin-bottom: 2px;
        }
        .medication {
          font-size: 10pt;
          font-weight: bold;
          text-transform: uppercase;
        }
        .strength {
          font-size: 8pt;
          font-weight: normal;
        }
        .instructions {
          font-size: 7pt;
          margin: 4px 0;
          flex-grow: 1;
        }
        .footer {
          display: flex;
          justify-content: space-between;
          font-size: 5pt;
          border-top: 1px solid black;
          padding-top: 2px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${pharmacyName}</h1>
        <p>${pharmacyPhone}</p>
      </div>
      
      ${data.patientName ? `<div class="patient">${data.patientName}</div>` : ''}
      
      <div class="medication">
        ${data.medicationName} <span class="strength">${data.strength || ''}</span>
      </div>
      
      <div class="instructions">
        ${data.dosageInstructions || 'Take as directed by physician.'}
      </div>
      
      <div class="footer">
        <div>Batch: ${data.batchNumber}</div>
        <div>Exp: ${expiry}</div>
        <div>Date: ${dispensed}</div>
      </div>
    </body>
    </html>
  `;

  // Create a hidden iframe
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '-1000px';
  iframe.style.bottom = '-1000px';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (doc) {
    doc.open();
    doc.write(htmlContent);
    doc.close();

    // Wait for content to load before printing
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 250);
  }
};
