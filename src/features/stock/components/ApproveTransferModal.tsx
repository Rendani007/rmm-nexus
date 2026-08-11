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
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import type { StockTransferRequest, InventoryLocation } from "@/types";

type ApproveTransferModalProps = {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    request: StockTransferRequest | null;
    locations: InventoryLocation[];
    targetLocationId: string;
    onLocationChange: (val: string) => void;
    onConfirm: () => void;
    approving: boolean;
};

export const ApproveTransferModal = ({
    isOpen,
    onOpenChange,
    request,
    locations,
    targetLocationId,
    onLocationChange,
    onConfirm,
    approving
}: ApproveTransferModalProps) => {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Approve Stock Transfer</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <p className="text-sm text-muted-foreground">
                        You are accepting{" "}
                        <strong>{request?.qty} × {request?.item?.name}</strong>{" "}
                        from <strong>{request?.from_department?.name}</strong>.
                        Select where this stock will be stored in your department.
                    </p>
                    <div className="space-y-2">
                        <Label>Destination Location</Label>
                        <Select value={targetLocationId} onValueChange={onLocationChange}>
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
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={approving}>Cancel</Button>
                    <Button onClick={onConfirm} disabled={!targetLocationId || approving}>
                        {approving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirm Approval
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
