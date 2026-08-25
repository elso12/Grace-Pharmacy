import { useEffect, useRef } from 'react';

/**
 * A hook to listen for barcode scanner inputs globally.
 * Hardware barcode scanners typically act as a keyboard wedge, rapidly typing characters
 * and concluding with an Enter keypress.
 *
 * @param onScan Callback fired when a barcode is successfully scanned
 * @param config Configuration options for timing and length
 */
export const useBarcodeScanner = (
  onScan: (barcode: string) => void,
  config = { minLength: 3, maxTimeoutMs: 150 }
) => {
  const buffer = useRef('');
  const lastKeyTime = useRef<number>(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field (except if it's the barcode scanner overriding it)
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        // If they are explicitly typing, we might still want to capture rapid input,
        // but typically we let the input handle it unless it's a global listener.
        // For POS, we usually capture global events.
      }

      const now = Date.now();
      
      // If it's been too long since the last key, reset the buffer
      if (now - lastKeyTime.current > config.maxTimeoutMs) {
        buffer.current = '';
      }
      
      lastKeyTime.current = now;

      if (e.key === 'Enter') {
        if (buffer.current.length >= config.minLength) {
          onScan(buffer.current);
          e.preventDefault(); // Prevent form submission if we captured a scan
        }
        buffer.current = '';
        return;
      }

      // Only accept printable characters (length 1)
      if (e.key.length === 1) {
        buffer.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onScan, config]);
};
