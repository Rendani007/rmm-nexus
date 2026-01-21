import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { listTransferRequests, approveTransfer, rejectTransfer } from "@/api/stock";
import { listLocations } from "@/api/locations";
import type { StockTransferRequest, InventoryLocation } from "@/types";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

export const StockApprovals = () => {
    const { toast } = useToast();
    const [requests, setRequests] = useState<StockTransferRequest[]>([]);
    const [loading, setLoading] = useState(true);

    // Approval specific
    const [selectedRequest, setSelectedRequest] = useState<StockTransferRequest | null>(null);
    const [isApproveOpen, setIsApproveOpen] = useState(false);
    const [locations, setLocations] = useState<InventoryLocation[]>([]);
    const [targetLocationId, setTargetLocationId] = useState("");

    const refresh = async () => {
        setLoading(true);
        try {
            const res = await listTransferRequests({ status: 'pending' });
            setRequests(res.data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refresh();
        // Pre-load locations for potential approval usage
        listLocations({}).then(data => setLocations(data || [])).catch(console.error);
    }, []);

    const handleApproveClick = (req: StockTransferRequest) => {
        setSelectedRequest(req);
        setTargetLocationId("");
        setIsApproveOpen(true);
    };

    const confirmApprove = async () => {
        if (!selectedRequest || !targetLocationId) return;
        try {
            await approveTransfer(selectedRequest.id, { to_location_id: targetLocationId });
            toast({ title: "Approved", description: "Stock transfer approved successfully." });
            setIsApproveOpen(false);
            refresh();
        } catch (e) {
            toast({ variant: "destructive", title: "Error", description: "Failed to approve transfer." });
        }
    };

    const handleReject = async (req: StockTransferRequest) => {
        if (!confirm("Are you sure you want to reject this transfer? Stock will be refunded to source.")) return;
        try {
            await rejectTransfer(req.id);
            toast({ title: "Rejected", description: "Stock transfer rejected." });
            refresh();
        } catch (e) {
            toast({ variant: "destructive", title: "Error", description: "Failed to reject transfer." });
        }
    };

    return (
        <Layout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold">Pending Transfer Requests</h1>
                    <p className="text-gray-500">Review and approve stock coming into your department.</p>
                </div>

                {loading ? <p>Loading...</p> : requests.length === 0 ? (
                    <div className="p-8 border rounded-lg text-center text-gray-500 bg-gray-50">
                        No pending requests found.
                    </div>
                ) : (
                    <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-100 border-b">
                                <tr>
                                    <th className="p-3 font-medium">Date</th>
                                    <th className="p-3 font-medium">Item</th>
                                    <th className="p-3 font-medium">Qty</th>
                                    <th className="p-3 font-medium">From</th>
                                    <th className="p-3 font-medium">To</th>
                                    <th className="p-3 font-medium">Initiator</th>
                                    <th className="p-3 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {requests.map(req => (
                                    <tr key={req.id} className="border-b last:border-0 hover:bg-gray-50">
                                        <td className="p-3">
                                            {format(new Date(req.created_at), "MMM d, HH:mm")}
                                        </td>
                                        <td className="p-3 font-medium">{req.item?.name} <span className="text-xs text-gray-500">({req.item?.sku})</span></td>
                                        <td className="p-3">{req.qty}</td>
                                        <td className="p-3">{req.from_department?.name || 'Unassigned'}</td>
                                        <td className="p-3">{req.to_department?.name || 'Unassigned'}</td>
                                        <td className="p-3">{req.creator?.first_name} {req.creator?.last_name}</td>
                                        <td className="p-3 text-right space-x-2">
                                            <Button size="sm" variant="outline" onClick={() => handleReject(req)} className="text-red-600 hover:text-red-700">Reject</Button>
                                            <Button size="sm" onClick={() => handleApproveClick(req)}>Approve</Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <Dialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Approve Stock Transfer</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <p className="text-sm text-gray-600">
                            You are accepting <strong>{selectedRequest?.qty} x {selectedRequest?.item?.name}</strong> from
                            <strong> {selectedRequest?.from_department?.name}</strong>.
                        </p>
                        <div className="space-y-2">
                            <Label>Destination Location (Your Dept)</Label>
                            <Select value={targetLocationId} onValueChange={setTargetLocationId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a location to store this stock" />
                                </SelectTrigger>
                                <SelectContent>
                                    {locations.map(loc => (
                                        <SelectItem key={loc.id} value={loc.id}>{loc.name} ({loc.code})</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsApproveOpen(false)}>Cancel</Button>
                        <Button onClick={confirmApprove} disabled={!targetLocationId}>Confirm Approval</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Layout>
    );
};
