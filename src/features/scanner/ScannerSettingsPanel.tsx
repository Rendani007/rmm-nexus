import { Vibrate, VibrateOff, ArrowRightLeft, Settings2, History } from "lucide-react";
import { Button } from "@/components/ui/button";

type ScannerSettingsPanelProps = {
  showSettings: boolean;
  hapticsEnabled: boolean;
  onToggleHaptics: () => void;
  onToggleCamera: () => void;
};

export const ScannerSettingsPanel = ({
  showSettings,
  hapticsEnabled,
  onToggleHaptics,
  onToggleCamera
}: ScannerSettingsPanelProps) => {
  if (!showSettings) return null;

  return (
    <div className="absolute top-16 right-4 z-30 bg-background/80 backdrop-blur-xl border border-white/10 p-3 rounded-2xl shadow-2xl flex flex-col gap-2 animate-in fade-in slide-in-from-top-2">
      <Button variant="ghost" size="sm" className="justify-start gap-3 w-full" onClick={onToggleHaptics}>
        {hapticsEnabled ? <Vibrate className="w-4 h-4" /> : <VibrateOff className="w-4 h-4 text-muted-foreground" />}
        {hapticsEnabled ? "Haptics On" : "Haptics Off"}
      </Button>
      <Button variant="ghost" size="sm" className="justify-start gap-3 w-full" onClick={onToggleCamera}>
        <ArrowRightLeft className="w-4 h-4" /> Switch Camera
      </Button>
    </div>
  );
};

type ScannerControlsProps = {
  onToggleSettings: () => void;
  onToggleHistory: () => void;
};

export const ScannerControls = ({ onToggleSettings, onToggleHistory }: ScannerControlsProps) => {
  return (
    <div className="absolute top-4 right-4 z-20 flex flex-col gap-3">
      <Button variant="secondary" size="icon" className="rounded-full bg-background/40 backdrop-blur-md text-white hover:bg-background/60 shadow-lg border-white/10" onClick={onToggleSettings}>
        <Settings2 className="w-5 h-5" />
      </Button>
      <Button variant="secondary" size="icon" className="rounded-full bg-background/40 backdrop-blur-md text-white hover:bg-background/60 shadow-lg border-white/10" onClick={onToggleHistory}>
        <History className="w-5 h-5" />
      </Button>
    </div>
  );
};
