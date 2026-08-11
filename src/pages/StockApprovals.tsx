import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthStore } from "@/features/auth/useAuthStore";
import { PackageOpen, Send } from "lucide-react";
import type { StockTransferRequest } from "@/types";

import { useStockApprovals } from "@/features/stock/hooks/useStockApprovals";
import { RequestTable } from "@/features/stock/components/RequestTable";
import { ApproveTransferModal } from "@/features/stock/components/ApproveTransferModal";
import { RejectTransferModal } from "@/features/stock/components/RejectTransferModal";

export const StockApprovals = () => {
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
