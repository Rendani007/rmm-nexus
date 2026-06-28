import { useEffect, useState, useRef } from "react";
import { Camera, AlertCircle, Loader2, RefreshCw, Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/Layout";
import { Html5QrcodeScanner, Html5QrcodeScanType } from "html5-qrcode";
import { scanItem, lookupExternalBarcode } from "@/api/items";
import type { InventoryItem } from "@/types";
import { ItemStockDrawer } from "@/features/items/ItemStockDrawer";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

// Helper to play a short beep sound without needing external assets
const playBeep = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note

    gainNode.gain.setValueAtTime(1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);

    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.1);
  } catch (e) {
    console.log("Audio not supported", e);
  }
};

export const ScanPage = () => {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(true);
  const [loading, setLoading] = useState(false);
  const [scannedItem, setScannedItem] = useState<InventoryItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notFoundBarcode, setNotFoundBarcode] = useState<string | null>(null);
  const [enrichedData, setEnrichedData] = useState<any>(null);
  
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    // Only initialize if we are in "scanning" mode and haven't already initialized
    if (scanning && !scannerRef.current) {
      scannerRef.current = new Html5QrcodeScanner(
        "reader",
        { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA]
        },
        /* verbose= */ false
      );

      scannerRef.current.render(onScanSuccess, onScanFailure);
    }

    // Cleanup function
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(error => {
          console.error("Failed to clear html5QrcodeScanner. ", error);
        });
        scannerRef.current = null;
      }
    };
  }, [scanning]);

  const onScanSuccess = async (decodedText: string, decodedResult: any) => {
    // Prevent multiple scans while processing
    if (loading || !scanning) return;
    
    // Stop scanning visually
    setScanning(false);
    setLoading(true);
    setNotFoundBarcode(null);
    setEnrichedData(null);
    playBeep();

    try {
      const item = await scanItem(decodedText);
      if (item) {
        setScannedItem(item);
        setDrawerOpen(true);
      } else {
        setNotFoundBarcode(decodedText);
        
        // Let's try to enrich from external API
        toast.info("Item not found. Looking up in global databases...");
        const externalData = await lookupExternalBarcode(decodedText);
        if (externalData && externalData.name) {
             setEnrichedData(externalData);
             toast.success(`Found product details for ${externalData.name}`);
        } else {
             toast.error(`Item with barcode ${decodedText} not found locally or globally.`);
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to lookup barcode. Server error.");
      setScanning(true); // resume on error
    } finally {
      setLoading(false);
    }
  };

  const onScanFailure = (error: any) => {
    // handle scan failure, usually better to ignore and keep scanning
    // console.warn(`Code scan error = ${error}`);
  };

  const handleResumeScanning = () => {
    setScannedItem(null);
    setNotFoundBarcode(null);
    setEnrichedData(null);
    setDrawerOpen(false);
    setScanning(true);
  };

  const handleCreateNew = () => {
    // Navigate to items list or a dedicated create page with state
    navigate('/items', { state: { prefillBarcode: notFoundBarcode, enrichedData: enrichedData, openCreateModal: true } });
  };

  return (
    <Layout>
      <div className="flex flex-col items-center justify-start sm:justify-center min-h-[60vh] p-2 sm:p-4 text-center w-full">
        <Card className="w-full max-w-md border-2 shadow-lg">
          <CardHeader className="pb-4">
            <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-2">
              <Camera className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Warehouse Scanner</CardTitle>
            <CardDescription>
              Scan standard barcodes or QR codes to instantly access item stock and details.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* The Scanner Viewport */}
            <div className={`overflow-hidden rounded-lg border-2 ${scanning ? 'border-primary/50' : 'border-muted'} bg-black relative min-h-[300px]`}>
                {loading && (
                    <div className="absolute inset-0 z-10 bg-background/80 flex flex-col items-center justify-center">
                        <Loader2 className="w-10 h-10 animate-spin text-primary mb-2" />
                        <p className="font-medium animate-pulse">Looking up item...</p>
                    </div>
                )}
                
                {/* ID must match the one passed to Html5QrcodeScanner */}
                <div id="reader" className="w-full h-full" style={{ display: scanning && !loading ? 'block' : 'none' }}></div>
                
                {!scanning && !loading && !notFoundBarcode && (
                    <div className="absolute inset-0 z-10 bg-background/95 flex flex-col items-center justify-center p-6 text-center">
                        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                            <RefreshCw className="w-8 h-8 text-green-500" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Scan Complete</h3>
                        <p className="text-muted-foreground mb-6">Item loaded successfully.</p>
                        <Button onClick={handleResumeScanning} className="w-full" size="lg">
                            <Camera className="mr-2 h-4 w-4" /> Scan Another Item
                        </Button>
                    </div>
                )}

                {!scanning && !loading && notFoundBarcode && (
                    <div className="absolute inset-0 z-10 bg-background/95 flex flex-col items-center justify-center p-6 text-center">
                        <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mb-4">
                            <AlertCircle className="w-8 h-8 text-destructive" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Item Not Found</h3>
                        <p className="text-muted-foreground mb-2 break-all">Barcode: {notFoundBarcode}</p>
                        
                        <div className="space-y-3 w-full mt-4">
                            <Button onClick={handleCreateNew} className="w-full" size="lg">
                                <Plus className="mr-2 h-4 w-4" /> Create New Item
                            </Button>
                            <Button onClick={handleResumeScanning} variant="outline" className="w-full" size="lg">
                                <Camera className="mr-2 h-4 w-4" /> Try Again
                            </Button>
                        </div>
                    </div>
                )}
            </div>

          </CardContent>
        </Card>
      </div>

      <ItemStockDrawer 
        open={drawerOpen} 
        item={scannedItem} 
        onClose={() => {
            setDrawerOpen(false);
            // Optionally auto-resume scanning when drawer closes
            // handleResumeScanning();
        }} 
      />
    </Layout>
  );
};
