import { Loader2 } from "lucide-react";

type ScannerLoadingStateProps = {
  loading: boolean;
};

export const ScannerLoadingState = ({ loading }: ScannerLoadingStateProps) => {
  if (!loading) return null;

  return (
    <div className="absolute inset-0 z-20 bg-black/40 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in">
      <div className="bg-background/70 p-8 rounded-3xl shadow-2xl border border-white/10 flex flex-col items-center backdrop-blur-xl">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
          <Loader2 className="w-14 h-14 animate-spin text-primary relative z-10" />
        </div>
        <p className="text-lg font-medium mt-6 text-foreground tracking-tight animate-pulse">Processing Barcode...</p>
      </div>
    </div>
  );
};
