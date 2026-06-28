import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { listTransferRequests, approveTransfer, rejectTransfer } from "@/api/stock";
import { listLocations } from "@/api/locations";
import type { StockTransferRequest, InventoryLocation } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useAuthStore } from "@/features/auth/useAuthStore";
import { PackageOpen, Send, Loader2 } from "lucide-react";

export const StockApprovals = () => {
    const { toast } = useToast();
    const { user } = useAuthStore();

    // Requests incoming to this dept (to_department = mine)
    const [incoming, setIncoming] = useState<StockTransferRequest[]>([]);
    // Requests outgoing from this dept (from_department = mine), still pending
    const [inTransit, setInTransit] = useState<StockTransferRequest[]>([]);
    const [loading, setLoading] = useState(true);

    // Approval specific
    const [selectedRequest, setSelectedRequest] = useState<StockTransferRequest | null>(null);
    const [isApproveOpen, setIsApproveOpen] = useState(false);
    const [locations, setLocations] = useState<InventoryLocation[]>([]);
    const [targetLocationId, setTargetLocationId] = useState("");

    // Reject specific
    const [requestToReject, setRequestToReject] = useState<StockTransferRequest | null>(null);

    const [approving, setApproving] = useState(false);
    const [rejecting, setRejecting] = useState(false);

    const refresh = async () => {
        setLoading(true);
        try {
            const [allReqs] = await Promise.all([
                listTransferRequests({ status: 'pending' }),
            ]);

            // Separate into incoming (my dept is receiving) and in-transit (my dept sent it)
            // DEBUG: Removing filters to see what's coming back from API
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
                    (r.created_by === user?.id) // Global fallback: if I created it, I should see it in In-Transit
                );
                
                setIncoming(incomingReqs);
                setInTransit(transitReqs);

                // Diagnostic log
                if (allReqs.length > 0) {
                    console.log('Diagnostic:', { 
                        all: allReqs.length, 
                        myDept: myDeptId,
                        sampleFrom: allReqs[0].from_department_id 
                    });
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refresh();
        listLocations({}).then(data => setLocations(data || [])).catch(console.error);
    }, []);

    const handleApproveClick = (req: StockTransferRequest) => {
        setSelectedRequest(req);
        setTargetLocationId("");
        setIsApproveOpen(true);
    };

    const confirmApprove = async () => {
        if (!selectedRequest || !targetLocationId) return;
        setApproving(true);
        try {
            await approveTransfer(selectedRequest.id, { to_location_id: targetLocationId });
            toast({ title: "Approved", description: "Stock transfer approved successfully." });
            setIsApproveOpen(false);
            refresh();
        } catch (e: any) {
            toast({ variant: "destructive", title: "Error", description: e?.response?.data?.message || "We encountered a problem approving the transfer. Please try again." });
        } finally {
            setApproving(false);
        }
    };

    const confirmReject = async () => {
        if (!requestToReject) return;
        const reqId = requestToReject.id;
        setRequestToReject(null);

        const previousIncoming = [...incoming];
        const previousInTransit = [...inTransit];
        setIncoming(prev => prev.filter(r => r.id !== reqId));
        setInTransit(prev => prev.filter(r => r.id !== reqId));

        setRejecting(true);
        try {
            await rejectTransfer(reqId);
            toast({ title: "Rejected", description: "Stock transfer rejected and stock refunded." });
            refresh();
        } catch (e: any) {
            setIncoming(previousIncoming);
            setInTransit(previousInTransit);
            toast({ variant: "destructive", title: "Error", description: e?.response?.data?.message || "We encountered a problem rejecting the transfer. Please try again." });
        } finally {
            setRejecting(false);
        }
    };

    const RequestTable = ({
        requests,
        showActions,
    }: {
        requests: StockTransferRequest[];
        showActions: boolean;
    }) => {
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
                                            onClick={() => setRequestToReject(req)}
                                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                        >
                                            Reject
                                        </Button>
                                        <Button size="sm" onClick={() => handleApproveClick(req)}>
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

    return (
        <Layout>
            <div className="space-y-6">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Approvals Inbox</h1>
                        <p className="text-muted-foreground">Manage incoming transfer requests and track outbound shipments.</p>
                    </div>
                    <Button onClick={() => window.location.href = '/stock/request'}>
                        + New Transfer Request
                    </Button>
                </div>

                {/* Debug Banner - Temporary for diagnosis */}
                <div className="p-3 bg-muted/50 border border-blue-200 rounded-lg flex flex-col gap-1 text-xs">
                    <div className="font-semibold text-blue-600 flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                        Diagnostic View
                    </div>
                    <div className="flex gap-6 mt-1">
                        <div>
                            <span className="text-muted-foreground">My Dept ID:</span>{" "}
                            <code className="bg-background px-1 rounded">{user?.department_id || 'NONE'}</code>
                        </div>
                        <div>
                            <span className="text-muted-foreground">API Raw Items:</span>{" "}
                            <code className="bg-background px-1 rounded">{incoming.length + inTransit.length} pending</code>
                        </div>
                    </div>
                    <Button 
                        variant="link" 
                        size="sm" 
                        onClick={refresh} 
                        disabled={loading}
                        className="p-0 h-auto text-[10px] w-fit text-blue-500 hover:text-blue-600"
                    >
                        Try Hard Refresh
                    </Button>
                </div>

                {loading ? (
                    <div className="p-10 text-center text-muted-foreground">Loading...</div>
                ) : (
                    <Tabs defaultValue="incoming">
                        <TabsList>
                            <TabsTrigger value="incoming" className="gap-2">
                                <PackageOpen className="h-4 w-4" />
                                Incoming
                                {incoming.length > 0 && (
                                    <span className="ml-1 inline-flex items-center justify-center rounded-full bg-destructive px-2 py-0.5 text-xs font-bold text-destructive-foreground">
                                        {incoming.length}
                                    </span>
                                )}
                            </TabsTrigger>
                            <TabsTrigger value="in-transit" className="gap-2">
                                <Send className="h-4 w-4" />
                                In Transit
                                {inTransit.length > 0 && (
                                    <span className="ml-1 inline-flex items-center justify-center rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-white">
                                        {inTransit.length}
                                    </span>
                                )}
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="incoming" className="mt-4 space-y-2">
                            <p className="text-sm text-muted-foreground">
                                Stock being sent to your department awaiting your confirmation.
                            </p>
                            <RequestTable requests={incoming} showActions={true} />
                        </TabsContent>

                        <TabsContent value="in-transit" className="mt-4 space-y-2">
                            <p className="text-sm text-muted-foreground">
                                Stock your department sent out that is currently awaiting approval from the receiving department.
                            </p>
                            <RequestTable requests={inTransit} showActions={false} />
                        </TabsContent>
                    </Tabs>
                )}
            </div>

            {/* Approve Dialog */}
            <Dialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Approve Stock Transfer</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <p className="text-sm text-muted-foreground">
                            You are accepting{" "}
                            <strong>{selectedRequest?.qty} × {selectedRequest?.item?.name}</strong>{" "}
                            from <strong>{selectedRequest?.from_department?.name}</strong>.
                            Select where this stock will be stored in your department.
                        </p>
                        <div className="space-y-2">
                            <Label>Destination Location</Label>
                            <Select value={targetLocationId} onValueChange={setTargetLocationId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a location to store this stock" />
                                </SelectTrigger>
                                <SelectContent>
                                    {locations.map(loc => (
                                        <SelectItem key={loc.id} value={String(loc.id)}>
                                            {loc.name} ({loc.code})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsApproveOpen(false)} disabled={approving}>Cancel</Button>
                        <Button onClick={confirmApprove} disabled={!targetLocationId || approving}>
                            {approving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirm Approval
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reject Dialog */}
            <AlertDialog open={!!requestToReject} onOpenChange={(open) => !open && setRequestToReject(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Reject Stock Transfer</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to reject this transfer? The stock will be refunded back to the source department.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={rejecting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmReject}
                            disabled={rejecting}
                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                        >
                            {rejecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Reject Transfer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Layout>
    );
};
