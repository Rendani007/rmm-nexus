import { Flashlight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ScannerReticleProps = {
  scanning: boolean;
  loading: boolean;
  scanStatus: 'idle' | 'success' | 'error';
  flashlightOn: boolean;
  onToggleFlashlight: () => void;
};

export const ScannerReticle = ({
  scanning,
  loading,
  scanStatus,
  flashlightOn,
  onToggleFlashlight
}: ScannerReticleProps) => {
  if (!scanning || loading) return null;

  return (
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
      <div className="absolute bottom-24 z-20 pointer-events-auto">
        <Button 
          variant="secondary" 
          size="lg" 
          className={cn("rounded-full w-14 h-14 shadow-2xl backdrop-blur-md border border-white/10 transition-colors", 
            flashlightOn ? "bg-white text-black hover:bg-gray-200" : "bg-black/40 text-white hover:bg-black/60"
          )}
          onClick={onToggleFlashlight}
        >
          <Flashlight className="w-6 h-6" />
        </Button>
      </div>
    </div>
  );
};
