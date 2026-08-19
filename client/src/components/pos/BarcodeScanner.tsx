import { useEffect } from 'react';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  debounceMs?: number;
  minLength?: number;
}

/**
 * Headless component that listens to global keyboard events and detects barcode scanner input.
 * Barcode scanners act as keyboards that send rapid keystrokes followed by 'Enter'.
 */
const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  onScan,
  debounceMs = 50,
  minLength = 5,
}) => {
  useEffect(() => {
    let barcodeBuffer = '';
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input or textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'Enter' && barcodeBuffer.length >= minLength) {
        onScan(barcodeBuffer);
        barcodeBuffer = '';
      } else if (e.key.length === 1) { // Single character key
        barcodeBuffer += e.key;
        
        if (timeoutId) clearTimeout(timeoutId);
        
        timeoutId = setTimeout(() => {
          // Clear buffer if typing too slow for a scanner
          barcodeBuffer = '';
        }, debounceMs);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onScan, debounceMs, minLength]);

  return null; // Headless component
};

export default BarcodeScanner;
