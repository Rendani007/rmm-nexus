import { useEffect, useState, useRef } from "react";
import { Camera, AlertCircle, Loader2, Plus, Flashlight, Settings2, Vibrate, VibrateOff, History, ArrowRightLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/Layout";
import { Html5Qrcode } from "html5-qrcode";
import { scanItem, lookupExternalBarcode } from "@/api/items";
import type { InventoryItem } from "@/types";
import { ItemStockDrawer } from "@/features/items/ItemStockDrawer";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

// Audio Feedback
const playChime = (success: boolean) => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    if (success) {
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      oscillator.frequency.exponentialRampToValueAtTime(1760, audioCtx.currentTime + 0.1); // Slide up to A6
      gainNode.gain.setValueAtTime(1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.15);
    } else {
      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(200, audioCtx.currentTime); 
      gainNode.gain.setValueAtTime(0.8, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.3);
    }
  } catch (e) {
    console.log("Audio not supported", e);
  }
};

type RecentScan = {
  barcode: string;
  success: boolean;
  timestamp: Date;
  itemName?: string;
};

export const ScanPage = () => {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scannedItem, setScannedItem] = useState<InventoryItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notFoundBarcode, setNotFoundBarcode] = useState<string | null>(null);
  const [enrichedData, setEnrichedData] = useState<any>(null);
  const [scanStatus, setScanStatus] = useState<'idle' | 'success' | 'error'>('idle');
  
  // Settings & Controls
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [flashlightOn, setFlashlightOn] = useState(false);
  const [frontCamera, setFrontCamera] = useState(false);
  const [recentScans, setRecentScans] = useState<RecentScan[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [hasCameras, setHasCameras] = useState(true);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  // Trigger haptic feedback
  const triggerVibrate = (pattern: number | number[]) => {
    if (hapticsEnabled && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  };

  const startScanner = async () => {
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
        onScanFailure
      );
      setScanning(true);
      setScanStatus('idle');
    } catch (err) {
      console.error("Error starting scanner", err);
      setHasCameras(false);
      toast.error("Could not access camera. Please check permissions.");
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        setScanning(false);
      } catch (err) {
        console.error("Failed to stop scanner", err);
      }
    }
  };

  const toggleFlashlight = async () => {
    if (html5QrCodeRef.current && scanning) {
      try {
        const state = !flashlightOn;
        await html5QrCodeRef.current.applyVideoConstraints({
          advanced: [{ torch: state } as any]
        });
        setFlashlightOn(state);
      } catch (error) {
        toast.error("Flashlight not supported on this device.");
      }
    }
  };

  const toggleCamera = async () => {
    await stopScanner();
    setFrontCamera(prev => !prev);
    setFlashlightOn(false); // Flashlight turns off on camera switch
    setTimeout(startScanner, 300);
  };

  useEffect(() => {
    startScanner();
    return () => { stopScanner(); };
  }, []);

  const onScanSuccess = async (decodedText: string) => {
    if (loading) return;
    
    await stopScanner();
    setLoading(true);
    setNotFoundBarcode(null);
    setEnrichedData(null);
    setScanStatus('idle');

    try {
      const item = await scanItem(decodedText);
      if (item) {
        setScanStatus('success');
        triggerVibrate(50); // short burst
        playChime(true);
        setScannedItem(item);
        
        // Add to history
        setRecentScans(prev => [{ barcode: decodedText, success: true, timestamp: new Date(), itemName: item.name }, ...prev].slice(0, 10));
        
        setTimeout(() => { setDrawerOpen(true); }, 300);
      } else {
        setScanStatus('error');
        triggerVibrate([100, 50, 100]); // double burst
        playChime(false);
        setNotFoundBarcode(decodedText);
        
        toast.info("Item not found locally. Searching global databases...", { duration: 2000 });
        const externalData = await lookupExternalBarcode(decodedText);
        
        if (externalData && externalData.name) {
          setEnrichedData(externalData);
          setRecentScans(prev => [{ barcode: decodedText, success: false, timestamp: new Date(), itemName: externalData.name }, ...prev].slice(0, 10));
          toast.success(`Found product details for ${externalData.name}`);
        } else {
          setRecentScans(prev => [{ barcode: decodedText, success: false, timestamp: new Date(), itemName: "Unknown Item" }, ...prev].slice(0, 10));
          toast.error(`Item with barcode ${decodedText} not found locally or globally.`);
        }
      }
    } catch (error) {
      console.error(error);
      triggerVibrate([100, 50, 100]);
      playChime(false);
      toast.error("Failed to lookup barcode. Server error.");
      startScanner();
    } finally {
      setLoading(false);
    }
  };

  const onScanFailure = () => {
    // Ignore constant reading failures
  };

  const handleResumeScanning = () => {
    setScannedItem(null);
    setNotFoundBarcode(null);
    setEnrichedData(null);
    setScanStatus('idle');
    setDrawerOpen(false);
    startScanner();
  };

  const handleCreateNew = () => {
    navigate('/items', { state: { prefillBarcode: notFoundBarcode, enrichedData: enrichedData, openCreateModal: true } });
  };

  return (
    <Layout noPadding>
      <div className="relative w-full h-[calc(100vh-64px)] sm:h-[calc(100vh-56px)] bg-black overflow-hidden flex flex-col">
        
        {/* Full-bleed scanner target div */}
        <div id="reader" className="w-full h-full absolute inset-0 object-cover z-0"></div>

        {/* Floating Control Panel */}
        <div className="absolute top-4 right-4 z-20 flex flex-col gap-3">
          <Button variant="secondary" size="icon" className="rounded-full bg-background/40 backdrop-blur-md text-white hover:bg-background/60 shadow-lg border-white/10" onClick={() => setShowSettings(!showSettings)}>
            <Settings2 className="w-5 h-5" />
          </Button>
          <Button variant="secondary" size="icon" className="rounded-full bg-background/40 backdrop-blur-md text-white hover:bg-background/60 shadow-lg border-white/10" onClick={() => setShowHistory(!showHistory)}>
            <History className="w-5 h-5" />
          </Button>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="absolute top-16 right-4 z-30 bg-background/80 backdrop-blur-xl border border-white/10 p-3 rounded-2xl shadow-2xl flex flex-col gap-2 animate-in fade-in slide-in-from-top-2">
            <Button variant="ghost" size="sm" className="justify-start gap-3 w-full" onClick={() => setHapticsEnabled(!hapticsEnabled)}>
              {hapticsEnabled ? <Vibrate className="w-4 h-4" /> : <VibrateOff className="w-4 h-4 text-muted-foreground" />}
              {hapticsEnabled ? "Haptics On" : "Haptics Off"}
            </Button>
            <Button variant="ghost" size="sm" className="justify-start gap-3 w-full" onClick={toggleCamera}>
              <ArrowRightLeft className="w-4 h-4" /> Switch Camera
            </Button>
          </div>
        )}

        {/* Recent History Panel */}
        {showHistory && (
           <div className="absolute top-16 right-4 w-64 z-30 bg-background/80 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 max-h-[60vh] overflow-y-auto">
             <h4 className="text-sm font-semibold flex items-center gap-2 border-b border-border/50 pb-2">
               <History className="w-4 h-4 text-primary" /> Recent Scans
             </h4>
             {recentScans.length === 0 ? (
               <p className="text-xs text-muted-foreground italic">No recent scans.</p>
             ) : (
               recentScans.map((scan, idx) => (
                 <div key={idx} className="flex flex-col gap-1 text-sm border-b border-white/5 last:border-0 pb-2">
                   <div className="flex justify-between items-center">
                     <span className="font-medium truncate max-w-[120px]" title={scan.itemName}>{scan.itemName || "Unknown"}</span>
                     {scan.success ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <AlertCircle className="w-4 h-4 text-red-500" />}
                   </div>
                   <div className="flex justify-between text-xs text-muted-foreground">
                     <span>{scan.barcode}</span>
                     <span>{scan.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                   </div>
                 </div>
               ))
             )}
           </div>
        )}

        {/* Reticle Overlay */}
        {scanning && !loading && (
          <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-center items-center">
            {/* Darkened overlay outside reticle */}
            <div className="absolute inset-0 shadow-[0_0_0_4000px_rgba(0,0,0,0.65)] z-[-1] transition-all duration-300" />
            
            <div className={cn(
              "relative w-64 h-40 transition-all duration-300",
              scanStatus === 'success' && "scale-105",
              scanStatus === 'error' && "scale-95"
            )}>
              {/* Corner brackets */}
              <div className={cn("absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 rounded-tl-xl transition-colors duration-300", 
                  scanStatus === 'idle' ? "border-white/80 shadow-[0_0_15px_rgba(255,255,255,0.2)]" : 
                  scanStatus === 'success' ? "border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]" : 
                  "border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                )} />
              <div className={cn("absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 rounded-tr-xl transition-colors duration-300", 
                  scanStatus === 'idle' ? "border-white/80 shadow-[0_0_15px_rgba(255,255,255,0.2)]" : 
                  scanStatus === 'success' ? "border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]" : 
                  "border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                )} />
              <div className={cn("absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 rounded-bl-xl transition-colors duration-300", 
                  scanStatus === 'idle' ? "border-white/80 shadow-[0_0_15px_rgba(255,255,255,0.2)]" : 
                  scanStatus === 'success' ? "border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]" : 
                  "border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                )} />
              <div className={cn("absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 rounded-br-xl transition-colors duration-300", 
                  scanStatus === 'idle' ? "border-white/80 shadow-[0_0_15px_rgba(255,255,255,0.2)]" : 
                  scanStatus === 'success' ? "border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]" : 
                  "border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                )} />
              
              {/* Animated scan line */}
              {scanStatus === 'idle' && (
                <div className="absolute top-0 left-0 w-full h-0.5 bg-primary/80 shadow-[0_0_12px_rgba(59,130,246,0.9)] animate-[scan_2s_ease-in-out_infinite]" />
              )}
            </div>
            
            <p className="text-white/70 mt-8 font-medium tracking-wide text-sm bg-black/40 px-4 py-1.5 rounded-full backdrop-blur-md">
              Position barcode within the frame
            </p>

            {/* Flashlight FAB */}
            <div className="absolute bottom-12 z-20 pointer-events-auto">
              <Button 
                variant="secondary" 
                size="lg" 
                className={cn("rounded-full w-14 h-14 shadow-2xl backdrop-blur-md border border-white/10 transition-colors", 
                  flashlightOn ? "bg-white text-black hover:bg-gray-200" : "bg-black/40 text-white hover:bg-black/60"
                )}
                onClick={toggleFlashlight}
              >
                <Flashlight className="w-6 h-6" />
              </Button>
            </div>
          </div>
        )}

        {/* Loading Overlay with Glassmorphism */}
        {loading && (
          <div className="absolute inset-0 z-20 bg-black/40 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in">
            <div className="bg-background/70 p-8 rounded-3xl shadow-2xl border border-white/10 flex flex-col items-center backdrop-blur-xl">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                <Loader2 className="w-14 h-14 animate-spin text-primary relative z-10" />
              </div>
              <p className="text-lg font-medium mt-6 text-foreground tracking-tight animate-pulse">Processing Barcode...</p>
            </div>
          </div>
        )}

        {/* Not Found Bottom Sheet Overlay */}
        {!scanning && !loading && notFoundBarcode && (
          <div className="absolute inset-x-0 bottom-0 z-30 p-4 animate-in slide-in-from-bottom-8 duration-300">
            <div className="bg-background/80 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.3)] p-6 flex flex-col items-center text-center pb-8">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4 ring-8 ring-destructive/5">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
              <h3 className="text-2xl font-bold mb-2 tracking-tight">Item Not Found</h3>
              <p className="text-muted-foreground mb-6 break-all font-mono text-sm bg-muted/50 px-3 py-1 rounded-md">
                {notFoundBarcode}
              </p>
              
              <div className="space-y-3 w-full max-w-sm">
                <Button onClick={handleCreateNew} className="w-full rounded-2xl h-14 text-base font-semibold shadow-lg shadow-primary/20">
                  <Plus className="mr-2 h-5 w-5" /> Auto-Fill New Item
                </Button>
                <Button onClick={handleResumeScanning} variant="secondary" className="w-full rounded-2xl h-14 text-base font-semibold bg-secondary/50 backdrop-blur-md hover:bg-secondary/70">
                  <Camera className="mr-2 h-5 w-5" /> Scan Again
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Generic Error / No Camera */}
        {!hasCameras && (
          <div className="absolute inset-0 z-20 bg-background/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
             <div className="bg-muted/50 p-6 rounded-3xl mb-6">
                <AlertCircle className="w-12 h-12 text-muted-foreground" />
             </div>
             <h3 className="text-2xl font-bold mb-3 tracking-tight">Camera Unavailable</h3>
             <p className="text-muted-foreground mb-8 max-w-sm">
                Please allow camera permissions or check if your device has a working camera.
             </p>
             <Button onClick={() => window.location.reload()} variant="outline" className="rounded-xl h-12 px-8">
                Refresh Permissions
             </Button>
          </div>
        )}

      </div>

      <ItemStockDrawer 
        open={drawerOpen} 
        item={scannedItem} 
        onClose={() => {
            setDrawerOpen(false);
            handleResumeScanning();
        }} 
      />
    </Layout>
  );
};
