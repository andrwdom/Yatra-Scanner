/**
 * QRScanner Component
 * 
 * Uses device camera to scan QR codes containing ticket UUIDs.
 * Uses html5-qrcode library for camera access and QR detection.
 * 
 * The QR code should contain ONLY the ticket UUID.
 */

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export default function QRScanner({ onScan, disabled }) {
  const [error, setError] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    // Initialize scanner when component mounts
    if (!scannerRef.current) return;

    const html5QrCode = new Html5Qrcode('qr-reader');
    html5QrCodeRef.current = html5QrCode;

    const startScanner = async () => {
      try {
        setError('');
        
        // Get available cameras
        const cameras = await Html5Qrcode.getCameras();
        
        if (!cameras || cameras.length === 0) {
          setError('No camera found. Please allow camera access.');
          return;
        }

        // Prefer back camera for mobile devices
        const backCamera = cameras.find(
          (camera) => camera.label.toLowerCase().includes('back') || 
                      camera.label.toLowerCase().includes('rear')
        );
        const cameraId = backCamera ? backCamera.id : cameras[0].id;

        await html5QrCode.start(
          cameraId,
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            // QR code detected - extract UUID
            if (!disabled) {
              onScan(decodedText.trim());
            }
          },
          () => {
            // QR code not detected in frame - ignore
          }
        );

        setIsScanning(true);
      } catch (err) {
        console.error('Camera error:', err);
        if (err.toString().includes('NotAllowedError')) {
          setError('Camera access denied. Please allow camera in browser settings.');
        } else if (err.toString().includes('NotFoundError')) {
          setError('No camera found on this device.');
        } else {
          setError('Failed to start camera. Please refresh and try again.');
        }
      }
    };

    startScanner();

    // Cleanup on unmount
    return () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch(console.error);
      }
    };
  }, [onScan, disabled]);

  // Stop scanner when disabled
  useEffect(() => {
    if (disabled && html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      html5QrCodeRef.current.stop().catch(console.error);
      setIsScanning(false);
    }
  }, [disabled]);

  return (
    <div className="qr-scanner">
      <div className="scanner-viewport">
        <div id="qr-reader" ref={scannerRef}></div>
        
        {!isScanning && !error && (
          <div className="scanner-loading">
            <p>Starting camera...</p>
          </div>
        )}

        {error && (
          <div className="scanner-error">
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>
              Retry
            </button>
          </div>
        )}
      </div>

      <div className="scanner-instructions">
        <p>Point camera at the QR code on the ticket</p>
      </div>
    </div>
  );
}
