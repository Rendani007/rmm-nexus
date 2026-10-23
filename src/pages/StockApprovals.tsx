import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthStore } from "@/features/auth/useAuthStore";
import { PackageOpen, Send, Plus } from "lucide-react";
import type { StockTransferRequest } from "@/types";

import { useStockApprovals } from "@/features/stock/hooks/useStockApprovals";
import { RequestTable } from "@/features/stock/components/RequestTable";
import { ApproveTransferModal } from "@/features/stock/components/ApproveTransferModal";
import { RejectTransferModal } from "@/features/stock/components/RejectTransferModal";

export const StockApprovals = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const {
        incoming,
        inTransit,
        loading,
        locations,
        approving,
        rejecting,
        refresh,
        approveRequest,
        rejectRequest
    } = useStockApprovals();

    // Approval specific
    const [selectedRequest, setSelectedRequest] = useState<StockTransferRequest | null>(null);
    const [isApproveOpen, setIsApproveOpen] = useState(false);
    const [targetLocationId, setTargetLocationId] = useState("");

    // Reject specific
    const [requestToReject, setRequestToReject] = useState<StockTransferRequest | null>(null);

    const handleApproveClick = (req: StockTransferRequest) => {
        setSelectedRequest(req);
        setTargetLocationId("");
        setIsApproveOpen(true);
    };

    const handleConfirmApprove = async () => {
        if (!selectedRequest || !targetLocationId) return;
        const success = await approveRequest(selectedRequest.id, targetLocationId);
        if (success) {
            setIsApproveOpen(false);
        }
    };

    const handleConfirmReject = async () => {
        if (!requestToReject) return;
        const reqId = requestToReject.id;
        setRequestToReject(null);
        await rejectRequest(reqId);
    };

    return (
        <Layout>
            <div className="space-y-4 sm:space-y-6 w-full max-w-full min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 w-full min-w-0">
                    <div className="min-w-0 w-full">
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Approvals Inbox</h1>
                        <p className="text-muted-foreground text-xs sm:text-sm mt-1 break-words">Manage incoming transfer requests and track outbound shipments.</p>
                    </div>
                    <Button onClick={() => navigate('/stock/request')} className="w-full sm:w-auto min-h-[44px] shrink-0">
                        <Plus className="mr-2 h-4 w-4" />
                        New Transfer Request
                    </Button>
                </div>

                {loading ? (
                    <div className="p-10 text-center text-muted-foreground">Loading...</div>
                ) : (
                    <Tabs defaultValue="incoming">
                        <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:inline-flex">
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
                            <RequestTable 
                                requests={incoming} 
                                showActions={true} 
                                onApprove={handleApproveClick}
                                onReject={setRequestToReject}
                            />
                        </TabsContent>

                        <TabsContent value="in-transit" className="mt-4 space-y-2">
                            <p className="text-sm text-muted-foreground">
                                Stock your department sent out that is currently awaiting approval from the receiving department.
                            </p>
                            <RequestTable 
                                requests={inTransit} 
                                showActions={false} 
                            />
                        </TabsContent>
                    </Tabs>
                )}
            </div>

            <ApproveTransferModal 
                isOpen={isApproveOpen}
                onOpenChange={setIsApproveOpen}
                request={selectedRequest}
                locations={locations}
                targetLocationId={targetLocationId}
                onLocationChange={setTargetLocationId}
                onConfirm={handleConfirmApprove}
                approving={approving}
            />

            <RejectTransferModal 
                requestToReject={requestToReject}
                onOpenChange={(open) => !open && setRequestToReject(null)}
                onConfirm={handleConfirmReject}
                rejecting={rejecting}
            />
        </Layout>
    );
};
