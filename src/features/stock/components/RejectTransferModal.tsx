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
import { Loader2 } from "lucide-react";
import type { StockTransferRequest } from "@/types";

type RejectTransferModalProps = {
    requestToReject: StockTransferRequest | null;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    rejecting: boolean;
};

export const RejectTransferModal = ({
    requestToReject,
    onOpenChange,
    onConfirm,
    rejecting
}: RejectTransferModalProps) => {
    return (
        <AlertDialog open={!!requestToReject} onOpenChange={onOpenChange}>
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
                        onClick={onConfirm}
                        disabled={rejecting}
                        className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                    >
                        {rejecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Reject Transfer
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};
