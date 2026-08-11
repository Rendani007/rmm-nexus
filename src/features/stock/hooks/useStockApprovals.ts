import { useState, useCallback, useEffect } from "react";
import { listTransferRequests, approveTransfer, rejectTransfer } from "@/api/stock";
import { listLocations } from "@/api/locations";
import type { StockTransferRequest, InventoryLocation } from "@/types";
import { useAuthStore } from "@/features/auth/useAuthStore";
import { useToast } from "@/components/ui/use-toast";

export const useStockApprovals = () => {
    const { toast } = useToast();
    const { user } = useAuthStore();

    const [incoming, setIncoming] = useState<StockTransferRequest[]>([]);
    const [inTransit, setInTransit] = useState<StockTransferRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [locations, setLocations] = useState<InventoryLocation[]>([]);

    const [approving, setApproving] = useState(false);
    const [rejecting, setRejecting] = useState(false);

    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            const [allReqs] = await Promise.all([
                listTransferRequests({ status: 'pending' }),
            ]);

            if (user?.is_tenant_admin) {
                setIncoming(allReqs);
                setInTransit([]);
            } else {
                const rawDeptId = user?.department_id;
                const myDeptId = String(rawDeptId || '').toLowerCase();
                
                const incomingReqs = allReqs.filter(r => 
                    String(r.to_department_id || '').toLowerCase() === myDeptId
                );
                
                const transitReqs = allReqs.filter(r => 
                    String(r.from_department_id || '').toLowerCase() === myDeptId ||
                    (r.created_by === user?.id)
                );
                
                setIncoming(incomingReqs);
                setInTransit(transitReqs);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        refresh();
        listLocations({}).then(data => setLocations(data || [])).catch(console.error);
    }, [refresh]);

    const approveRequest = async (requestId: string, targetLocationId: string) => {
        setApproving(true);
        try {
            await approveTransfer(requestId, { to_location_id: targetLocationId });
            toast({ title: "Approved", description: "Stock transfer approved successfully." });
            await refresh();
            return true;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (e: any) {
            toast({ variant: "destructive", title: "Error", description: e?.response?.data?.message || "We encountered a problem approving the transfer. Please try again." });
            return false;
        } finally {
            setApproving(false);
        }
    };

    const rejectRequest = async (requestId: string) => {
        const previousIncoming = [...incoming];
        const previousInTransit = [...inTransit];
        
        // Optimistic UI update
        setIncoming(prev => prev.filter(r => r.id !== requestId));
        setInTransit(prev => prev.filter(r => r.id !== requestId));

        setRejecting(true);
        try {
            await rejectTransfer(requestId);
            toast({ title: "Rejected", description: "Stock transfer rejected and stock refunded." });
            await refresh();
            return true;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (e: any) {
            // Revert optimistic update
            setIncoming(previousIncoming);
            setInTransit(previousInTransit);
            toast({ variant: "destructive", title: "Error", description: e?.response?.data?.message || "We encountered a problem rejecting the transfer. Please try again." });
            return false;
        } finally {
            setRejecting(false);
        }
    };

    return {
        incoming,
        inTransit,
        loading,
        locations,
        approving,
        rejecting,
        refresh,
        approveRequest,
        rejectRequest
    };
};
