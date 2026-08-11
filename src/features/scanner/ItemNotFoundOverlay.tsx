import { Plus, Camera, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type ItemNotFoundOverlayProps = {
  visible: boolean;
  notFoundBarcode: string | null;
  onCreateNew: () => void;
  onResumeScanning: () => void;
};

export const ItemNotFoundOverlay = ({
  visible,
  notFoundBarcode,
  onCreateNew,
  onResumeScanning
}: ItemNotFoundOverlayProps) => {
  if (!visible || !notFoundBarcode) return null;

  return (
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
          <Button onClick={onCreateNew} className="w-full rounded-2xl h-14 text-base font-semibold shadow-lg shadow-primary/20">
            <Plus className="mr-2 h-5 w-5" /> Auto-Fill New Item
          </Button>
          <Button onClick={onResumeScanning} variant="secondary" className="w-full rounded-2xl h-14 text-base font-semibold bg-secondary/50 backdrop-blur-md hover:bg-secondary/70">
            <Camera className="mr-2 h-5 w-5" /> Scan Again
          </Button>
        </div>
      </div>
    </div>
  );
};
