import { format } from "date-fns";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { StockTransferRequest } from "@/types";

type RequestTableProps = {
    requests: StockTransferRequest[];
    showActions: boolean;
    onApprove?: (req: StockTransferRequest) => void;
    onReject?: (req: StockTransferRequest) => void;
};

export const RequestTable = ({
    requests,
    showActions,
    onApprove,
    onReject,
}: RequestTableProps) => {
    if (requests.length === 0) {
        return (
            <div className="p-8 sm:p-10 border rounded-xl text-center text-muted-foreground bg-muted/20">
                Nothing here yet.
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Mobile Card View */}
            <div className="block md:hidden space-y-3">
                {requests.map(req => (
                    <div key={req.id} className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-xs text-muted-foreground font-medium">
                                {format(new Date(req.created_at), "MMM d, yyyy • HH:mm")}
                            </span>
                            <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200 text-xs">
                                🚚 In Transit
                            </Badge>
                        </div>

                        <div>
                            <h4 className="font-semibold text-base text-foreground leading-snug">
                                {req.item?.name}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                                {req.item?.sku && (
                                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground font-medium">
                                        {req.item.sku}
                                    </span>
                                )}
                                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary">
                                    Qty: {req.qty}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 p-2.5 rounded-lg border border-border/50">
                            <div className="flex-1 truncate">
                                <span className="text-muted-foreground">From: </span>
                                <strong className="text-foreground">{req.from_department?.name || '—'}</strong>
                            </div>
                            <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            <div className="flex-1 truncate">
                                <span className="text-muted-foreground">To: </span>
                                <strong className="text-foreground">{req.to_department?.name || '—'}</strong>
                            </div>
                        </div>

                        <div className="text-xs text-muted-foreground">
                            Initiated by: <span className="text-foreground font-medium">{req.creator?.first_name} {req.creator?.last_name}</span>
                        </div>

                        {showActions && (
                            <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                                <Button
                                    variant="outline"
                                    className="flex-1 min-h-[44px] text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => onReject?.(req)}
                                >
                                    Reject
                                </Button>
                                <Button 
                                    className="flex-1 min-h-[44px] bg-emerald-600 hover:bg-emerald-700 text-white" 
                                    onClick={() => onApprove?.(req)}
                                >
                                    Approve
                                </Button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block border rounded-lg overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="border-b bg-muted/50">
                        <tr>
                            <th className="p-3 font-medium">Date</th>
                            <th className="p-3 font-medium">Item</th>
                            <th className="p-3 font-medium">Qty</th>
                            <th className="p-3 font-medium">From</th>
                            <th className="p-3 font-medium">To</th>
                            <th className="p-3 font-medium">Initiated By</th>
                            <th className="p-3 font-medium">Status</th>
                            {showActions && <th className="p-3 font-medium text-right">Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {requests.map(req => (
                            <tr key={req.id} className="border-b last:border-0 hover:bg-muted/20">
                                <td className="p-3 text-muted-foreground whitespace-nowrap">
                                    {format(new Date(req.created_at), "MMM d, HH:mm")}
                                </td>
                                <td className="p-3 font-medium">
                                    {req.item?.name}
                                    {req.item?.sku && (
                                        <span className="ml-1 text-xs text-muted-foreground">({req.item.sku})</span>
                                    )}
                                </td>
                                <td className="p-3 font-semibold">{req.qty}</td>
                                <td className="p-3">{req.from_department?.name || '—'}</td>
                                <td className="p-3">{req.to_department?.name || '—'}</td>
                                <td className="p-3">{req.creator?.first_name} {req.creator?.last_name}</td>
                                <td className="p-3">
                                    <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200">
                                        🚚 In Transit
                                    </Badge>
                                </td>
                                {showActions && (
                                    <td className="p-3 text-right space-x-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => onReject?.(req)}
                                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                        >
                                            Reject
                                        </Button>
                                        <Button size="sm" onClick={() => onApprove?.(req)}>
                                            Approve
                                        </Button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
