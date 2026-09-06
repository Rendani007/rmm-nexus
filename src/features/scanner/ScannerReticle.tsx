import { cn } from "@/lib/utils";

type ScannerReticleProps = {
  scanning: boolean;
  loading: boolean;
  scanStatus: 'idle' | 'success' | 'error';
};

export const ScannerReticle = ({
  scanning,
  loading,
  scanStatus,
}: ScannerReticleProps) => {
  if (!scanning || loading) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-center items-center">
      {/* SVG Mask for true "cutout" effect */}
      <svg className="absolute inset-0 w-full h-full z-[-1]">
        <defs>
          <mask id="cutout-mask" x="0" y="0" width="100%" height="100%">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {/* The transparent cutout window in the middle */}
            <rect x="50%" y="45%" width="256" height="160" rx="16" transform="translate(-128, -80)" fill="black" />
          </mask>
        </defs>
        <rect x="0" y="0" width="100%" height="100%" fill="rgba(0,0,0,0.6)" mask="url(#cutout-mask)" />
      </svg>
      
      {/* Floating Viewfinder Frame */}
      <div className={cn(
        "relative w-64 h-40 transition-all duration-300 -translate-y-[5%]",
        scanStatus === 'success' && "scale-105",
        scanStatus === 'error' && "scale-95"
      )}>
        {/* Corner brackets */}
        <div className={cn("absolute top-0 left-0 w-10 h-10 border-t-[5px] border-l-[5px] rounded-tl-2xl transition-colors duration-300", 
            scanStatus === 'idle' ? "border-white/90 shadow-[0_0_15px_rgba(255,255,255,0.2)]" : 
            scanStatus === 'success' ? "border-green-400 shadow-[0_0_20px_rgba(74,222,128,0.6)]" : 
            "border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.6)]"
          )} />
        <div className={cn("absolute top-0 right-0 w-10 h-10 border-t-[5px] border-r-[5px] rounded-tr-2xl transition-colors duration-300", 
            scanStatus === 'idle' ? "border-white/90 shadow-[0_0_15px_rgba(255,255,255,0.2)]" : 
            scanStatus === 'success' ? "border-green-400 shadow-[0_0_20px_rgba(74,222,128,0.6)]" : 
            "border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.6)]"
          )} />
        <div className={cn("absolute bottom-0 left-0 w-10 h-10 border-b-[5px] border-l-[5px] rounded-bl-2xl transition-colors duration-300", 
            scanStatus === 'idle' ? "border-white/90 shadow-[0_0_15px_rgba(255,255,255,0.2)]" : 
            scanStatus === 'success' ? "border-green-400 shadow-[0_0_20px_rgba(74,222,128,0.6)]" : 
            "border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.6)]"
          )} />
        <div className={cn("absolute bottom-0 right-0 w-10 h-10 border-b-[5px] border-r-[5px] rounded-br-2xl transition-colors duration-300", 
            scanStatus === 'idle' ? "border-white/90 shadow-[0_0_15px_rgba(255,255,255,0.2)]" : 
            scanStatus === 'success' ? "border-green-400 shadow-[0_0_20px_rgba(74,222,128,0.6)]" : 
            "border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.6)]"
          )} />
        
        {/* Animated scan line */}
        {scanStatus === 'idle' && (
          <div className="absolute top-0 left-0 w-full h-1 rounded-full bg-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.9)] animate-[scan_2s_ease-in-out_infinite]" />
        )}
      </div>
      
      <p className="text-white/80 mt-12 font-semibold tracking-wide text-[15px] bg-black/50 px-6 py-2 rounded-full backdrop-blur-xl border border-white/10 shadow-2xl">
        Point at a barcode
      </p>
    </div>
  );
};
