import { useState, useRef } from 'react';
import { Upload, FileDown, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { importItems, downloadTemplate } from '@/api/items';
import { toast } from 'sonner';

interface ImportItemsDialogProps {
    open: boolean;
    onClose: (reload?: boolean) => void;
}

export const ImportItemsDialog = ({ open, onClose }: ImportItemsDialogProps) => {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<{ created: number; updated: number; errors: string[] } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setResult(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setResult(null);

        try {
            const res = await importItems(file);
            setResult({
                created: res.created,
                updated: res.updated,
                errors: res.errors || []
            });
            toast.success('Import process completed');
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to import items');
        } finally {
            setUploading(false);
        }
    };

    const handleClose = () => {
        if (result && (result.created > 0 || result.updated > 0)) {
            onClose(true); // reload list
        } else {
            onClose(false);
        }
        // Reset state
        setTimeout(() => {
            setFile(null);
            setResult(null);
        }, 300);
    };

    return (
        <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>Import Inventory</DialogTitle>
                    <DialogDescription>
                        Bulk create or update items by uploading a CSV file.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {!result ? (
                        <>
                            <div className="rounded-lg border border-dashed p-8 text-center bg-muted/50">
                                <Upload className="mx-auto h-10 w-10 text-muted-foreground" />
                                <div className="mt-4">
                                    <label htmlFor="file-upload" className="cursor-pointer">
                                        <span className="mt-2 block text-sm font-semibold text-primary hover:underline">
                                            Choose a CSV file
                                        </span>
                                        <input
                                            id="file-upload"
                                            ref={fileInputRef}
                                            type="file"
                                            className="hidden"
                                            accept=".csv,.txt,.xlsx,.xls"
                                            onChange={handleFileChange}
                                        />
                                    </label>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {file ? file.name : 'CSV or Excel files up to 5MB'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                                <p>Need the correct format?</p>
                                <Button variant="link" size="sm" onClick={downloadTemplate} className="h-auto p-0">
                                    <FileDown className="mr-1 h-3 w-3" /> Download Template
                                </Button>
                            </div>
                        </>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-green-600">
                                <CheckCircle className="h-5 w-5" />
                                <span className="font-medium">Import Completed</span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-center">
                                <div className="rounded-md bg-muted p-3">
                                    <div className="text-2xl font-bold">{result.created}</div>
                                    <div className="text-xs text-muted-foreground">Items Created</div>
                                </div>
                                <div className="rounded-md bg-muted p-3">
                                    <div className="text-2xl font-bold">{result.updated}</div>
                                    <div className="text-xs text-muted-foreground">Items Updated</div>
                                </div>
                            </div>

                            {result.errors.length > 0 && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Import Errors</AlertTitle>
                                    <AlertDescription className="max-h-32 overflow-y-auto text-xs mt-2">
                                        <ul className="list-disc pl-4 space-y-1">
                                            {result.errors.map((err, i) => (
                                                <li key={i}>{err}</li>
                                            ))}
                                        </ul>
                                    </AlertDescription>
                                </Alert>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={handleClose} disabled={uploading}>
                        {result ? 'Close' : 'Cancel'}
                    </Button>
                    {!result && (
                        <Button
                            onClick={handleUpload}
                            disabled={!file || uploading}
                        >
                            {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Upload
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
