import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/Layout";
import { scanItem, lookupExternalBarcode } from "@/api/items";
import type { InventoryItem } from "@/types";
import { ItemStockDrawer } from "@/features/items/ItemStockDrawer";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { parseGS1, type GS1Data } from "@/lib/gs1Parser";

import { useFeedback } from "@/hooks/useFeedback";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";

import { ScannerReticle } from "@/features/scanner/ScannerReticle";
import { ScannerLoadingState } from "@/features/scanner/ScannerLoadingState";
import { ItemNotFoundOverlay } from "@/features/scanner/ItemNotFoundOverlay";
import { RecentScansPanel, type RecentScan } from "@/features/scanner/RecentScansPanel";
import { ScannerSettingsPanel, ScannerControls } from "@/features/scanner/ScannerSettingsPanel";

export const ScanPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [scannedItem, setScannedItem] = useState<InventoryItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notFoundBarcode, setNotFoundBarcode] = useState<string | null>(null);
  const [enrichedData, setEnrichedData] = useState<Record<string, unknown> | null>(null);
  const [scannedGs1Data, setScannedGs1Data] = useState<GS1Data | null>(null);
  const [scanStatus, setScanStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [recentScans, setRecentScans] = useState<RecentScan[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const { hapticsEnabled, setHapticsEnabled, playChime, triggerVibrate } = useFeedback();

  const onScanSuccess = async (decodedText: string) => {
    if (loading) return;
    
    await stopScanner();
    setLoading(true);
    setNotFoundBarcode(null);
    setEnrichedData(null);
    setScannedGs1Data(null);
    setScanStatus('idle');

    try {
      const gs1Parsed = parseGS1(decodedText);
      const searchBarcode = gs1Parsed?.gtin || decodedText;
      
      if (gs1Parsed) {
          setScannedGs1Data(gs1Parsed);
          toast.success("Parsed Supply Chain Barcode", { duration: 2000 });
      }

      const item = await scanItem(searchBarcode);
      if (item) {
        setScanStatus('success');
        triggerVibrate(50);
        playChime(true);
        setScannedItem(item);
        setRecentScans(prev => [{ barcode: searchBarcode, success: true, timestamp: new Date(), itemName: item.name }, ...prev].slice(0, 10));
        setTimeout(() => { setDrawerOpen(true); }, 300);
      } else {
        setScanStatus('error');
        triggerVibrate([100, 50, 100]);
        playChime(false);
        setNotFoundBarcode(searchBarcode);
        
        toast.info("Item not found locally. Searching global databases...", { duration: 2000 });
        const externalData = await lookupExternalBarcode(searchBarcode);
        
        if (externalData && externalData.name) {
          setEnrichedData(externalData);
          setRecentScans(prev => [{ barcode: searchBarcode, success: false, timestamp: new Date(), itemName: externalData.name }, ...prev].slice(0, 10));
          toast.success(`Found product details for ${externalData.name}`);
        } else {
          setRecentScans(prev => [{ barcode: searchBarcode, success: false, timestamp: new Date(), itemName: "Unknown Item" }, ...prev].slice(0, 10));
          toast.error(`Item with barcode ${searchBarcode} not found locally or globally.`);
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

  const {
    scanning,
    flashlightOn,
    hasCameras,
    startScanner,
    stopScanner,
    toggleFlashlight,
    toggleCamera
  } = useBarcodeScanner({ onScanSuccess });

  const handleResumeScanning = () => {
    setScannedItem(null);
    setNotFoundBarcode(null);
    setEnrichedData(null);
    setScannedGs1Data(null);
    setScanStatus('idle');
    setDrawerOpen(false);
    startScanner();
  };

  const handleCreateNew = () => {
    navigate('/items', { state: { prefillBarcode: notFoundBarcode, enrichedData: enrichedData, openCreateModal: true } });
  };

  return (
    <Layout noPadding>
      <div className="relative w-full h-[100dvh] bg-black flex flex-col">
        <div id="reader" className="w-full h-full absolute inset-0 object-cover z-0"></div>

        <ScannerControls 
          onToggleSettings={() => setShowSettings(!showSettings)} 
          onToggleHistory={() => setShowHistory(!showHistory)} 
        />

        <ScannerSettingsPanel 
          showSettings={showSettings} 
          hapticsEnabled={hapticsEnabled} 
          onToggleHaptics={() => setHapticsEnabled(!hapticsEnabled)} 
          onToggleCamera={toggleCamera} 
        />

        <RecentScansPanel 
          showHistory={showHistory} 
          recentScans={recentScans} 
        />

        <ScannerReticle 
          scanning={scanning} 
          loading={loading} 
          scanStatus={scanStatus} 
          flashlightOn={flashlightOn} 
          onToggleFlashlight={toggleFlashlight} 
        />

        <ScannerLoadingState loading={loading} />

        <ItemNotFoundOverlay 
          visible={!scanning && !loading && !!notFoundBarcode} 
          notFoundBarcode={notFoundBarcode} 
          onCreateNew={handleCreateNew} 
          onResumeScanning={handleResumeScanning} 
        />

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
        gs1Data={scannedGs1Data} 
        onClose={() => {
            setDrawerOpen(false);
            handleResumeScanning();
        }} 
      />
    </Layout>
  );
};
