import { History, CheckCircle2, AlertCircle } from "lucide-react";

export type RecentScan = {
  barcode: string;
  success: boolean;
  timestamp: Date;
  itemName?: string;
};

type RecentScansPanelProps = {
  showHistory: boolean;
  recentScans: RecentScan[];
};

export const RecentScansPanel = ({ showHistory, recentScans }: RecentScansPanelProps) => {
  if (!showHistory) return null;

  return (
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
  );
};
