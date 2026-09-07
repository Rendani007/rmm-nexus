import { useState, useRef, useCallback, useEffect } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { toast } from 'sonner';

type UseBarcodeScannerProps = {
  scanMode: 'barcode' | 'qrcode';
  onScanSuccess: (decodedText: string) => void;
  onScanFailure?: (errorMessage: string) => void;
};

export const useBarcodeScanner = ({ scanMode, onScanSuccess, onScanFailure }: UseBarcodeScannerProps) => {
  const [scanning, setScanning] = useState(false);
  const [flashlightOn, setFlashlightOn] = useState(false);
  const [frontCamera, setFrontCamera] = useState(false);
  const [hasCameras, setHasCameras] = useState(true);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const currentModeRef = useRef<'barcode' | 'qrcode' | null>(null);
  const isStartingRef = useRef<boolean>(false);

  const startScanner = useCallback(async () => {
    if (isStartingRef.current) return;
    
    // Check if mode changed; if so, we MUST destroy the old instance
    if (currentModeRef.current !== scanMode && html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        html5QrCodeRef.current.clear();
      } catch (err) {
        // Ignore cleanup errors
      }
      html5QrCodeRef.current = null;
    }

    const currentState = html5QrCodeRef.current?.getState?.();
    if (currentState === 2) {
      setScanning(true);
      return;
    }

    try {
      isStartingRef.current = true;
      if (!html5QrCodeRef.current) {
        const formatsToSupport = scanMode === 'qrcode' 
          ? [Html5QrcodeSupportedFormats.QR_CODE]
          : [
              Html5QrcodeSupportedFormats.CODE_128,
              Html5QrcodeSupportedFormats.CODE_39,
              Html5QrcodeSupportedFormats.EAN_13,
              Html5QrcodeSupportedFormats.UPC_A,
              Html5QrcodeSupportedFormats.UPC_E,
              Html5QrcodeSupportedFormats.EAN_8,
              Html5QrcodeSupportedFormats.ITF,
            ];

        html5QrCodeRef.current = new Html5Qrcode("reader", { formatsToSupport });
        currentModeRef.current = scanMode;
      }
      
      const config = {
        fps: 15,
        qrbox: scanMode === 'qrcode' ? { width: 250, height: 250 } : { width: 250, height: 120 }, 
        aspectRatio: window.innerWidth / window.innerHeight,
      };

      const cameraConfig = frontCamera ? "user" : "environment";
      
      await html5QrCodeRef.current.start(
        { facingMode: cameraConfig },
        config,
        onScanSuccess,
        onScanFailure || (() => {})
      );
      setScanning(true);
    } catch (err: any) {
      const errorMessage = err?.message || err?.toString() || "Unknown error";
      
      // If it throws this specific error, it means the camera is ACTUALLY running
      // but the internal library state got desynced during a React re-render.
      if (errorMessage.includes("Cannot clear while scan is ongoing")) {
        setScanning(true);
        return;
      }
      
      console.error("Error starting scanner", err);
      setHasCameras(false);
      toast.error(`Camera Error: ${errorMessage}`);
    } finally {
      isStartingRef.current = false;
    }
  }, [frontCamera, onScanSuccess, onScanFailure, scanMode]);

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
