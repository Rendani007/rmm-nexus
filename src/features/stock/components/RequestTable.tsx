import { format } from "date-fns";
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
            <div className="p-10 border rounded-lg text-center text-muted-foreground bg-muted/30">
                Nothing here yet.
            </div>
        );
    }

    return (
        <div className="border rounded-lg overflow-hidden">
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
    );
};
