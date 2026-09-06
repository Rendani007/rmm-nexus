import { Vibrate, VibrateOff, ArrowRightLeft, Settings2, History, Flashlight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ScannerBottomBarProps = {
  flashlightOn: boolean;
  onToggleFlashlight: () => void;
  onToggleCamera: () => void;
  showSettings: boolean;
  onToggleSettings: () => void;
  hapticsEnabled: boolean;
  onToggleHaptics: () => void;
  onToggleHistory: () => void;
};

export const ScannerBottomBar = ({
  flashlightOn,
  onToggleFlashlight,
  onToggleCamera,
  showSettings,
  onToggleSettings,
  hapticsEnabled,
  onToggleHaptics,
  onToggleHistory
}: ScannerBottomBarProps) => {
  return (
    <div className="absolute bottom-20 left-0 w-full px-6 flex flex-col gap-4 z-30 pointer-events-auto">
      
      {/* Settings popover */}
      {showSettings && (
        <div className="self-end bg-background/80 backdrop-blur-xl border border-white/10 p-3 rounded-2xl shadow-2xl flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 mb-2">
          <Button variant="ghost" size="sm" className="justify-start gap-3 w-full text-white" onClick={onToggleHaptics}>
            {hapticsEnabled ? <Vibrate className="w-4 h-4" /> : <VibrateOff className="w-4 h-4 text-white/50" />}
            {hapticsEnabled ? "Haptics On" : "Haptics Off"}
          </Button>
          <Button variant="ghost" size="sm" className="justify-start gap-3 w-full text-white" onClick={onToggleSettings}>
            Close Settings
          </Button>
        </div>
      )}

      {/* Main Action Bar */}
      <div className="flex items-center justify-between bg-black/50 backdrop-blur-2xl border border-white/10 p-3 rounded-[2rem] shadow-2xl">
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full w-12 h-12 text-white hover:bg-white/20 transition-colors" 
          onClick={onToggleHistory}
        >
          <History className="w-6 h-6" />
        </Button>
        
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full w-14 h-14 text-white hover:bg-white/20 transition-colors bg-white/10" 
            onClick={onToggleCamera}
          >
            <ArrowRightLeft className="w-6 h-6" />
          </Button>
          
          <Button 
            variant="default" 
            size="icon" 
            className={cn("rounded-full w-14 h-14 transition-colors shadow-lg", 
              flashlightOn ? "bg-white text-black hover:bg-gray-200" : "bg-white/10 text-white hover:bg-white/20"
            )}
            onClick={onToggleFlashlight}
          >
            <Flashlight className="w-6 h-6" />
          </Button>
        </div>

        <Button 
          variant="ghost" 
          size="icon" 
          className={cn("rounded-full w-12 h-12 text-white transition-colors", showSettings ? "bg-white/20" : "hover:bg-white/20")}
          onClick={onToggleSettings}
        >
          <Settings2 className="w-6 h-6" />
        </Button>
      </div>
    </div>
  );
};
