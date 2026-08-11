import { useState, useRef, useCallback, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { toast } from 'sonner';

type UseBarcodeScannerProps = {
  onScanSuccess: (decodedText: string) => void;
  onScanFailure?: (errorMessage: string) => void;
};

export const useBarcodeScanner = ({ onScanSuccess, onScanFailure }: UseBarcodeScannerProps) => {
  const [scanning, setScanning] = useState(false);
  const [flashlightOn, setFlashlightOn] = useState(false);
  const [frontCamera, setFrontCamera] = useState(false);
  const [hasCameras, setHasCameras] = useState(true);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  const startScanner = useCallback(async () => {
    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode("reader", false);
      }
      
      const config = {
        fps: 15,
        qrbox: { width: 250, height: 150 }, 
        aspectRatio: window.innerHeight / window.innerWidth,
      };

      const cameraFacing = frontCamera ? "user" : "environment";
      
      await html5QrCodeRef.current.start(
        { facingMode: cameraFacing },
        config,
        onScanSuccess,
        onScanFailure || (() => {})
      );
      setScanning(true);
    } catch (err) {
      console.error("Error starting scanner", err);
      setHasCameras(false);
      toast.error("Could not access camera. Please check permissions.");
    }
  }, [frontCamera, onScanSuccess, onScanFailure]);

  const stopScanner = useCallback(async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        setScanning(false);
      } catch (err) {
        console.error("Failed to stop scanner", err);
      }
    }
  }, []);

  const toggleFlashlight = useCallback(async () => {
    if (html5QrCodeRef.current && scanning) {
      try {
        const state = !flashlightOn;
        await html5QrCodeRef.current.applyVideoConstraints({
          advanced: [{ torch: state } as MediaTrackConstraintSet]
        });
        setFlashlightOn(state);
      } catch (error) {
        toast.error("Flashlight not supported on this device.");
      }
    }
  }, [scanning, flashlightOn]);

  const toggleCamera = useCallback(async () => {
    await stopScanner();
    setFrontCamera(prev => !prev);
    setFlashlightOn(false); // Flashlight turns off on camera switch
    setTimeout(startScanner, 300);
  }, [stopScanner, startScanner]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch(console.error);
      }
    };
  }, []);

  return {
    scanning,
    flashlightOn,
    frontCamera,
    hasCameras,
    startScanner,
    stopScanner,
    toggleFlashlight,
    toggleCamera,
  };
};
