import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { getLocationStock } from "@/api/locations";
import { Loader2, Package } from "lucide-react";

interface LocationStockDrawerProps {
    locationId: string | null;
    onClose: () => void;
}

export function LocationStockDrawer({ locationId, onClose }: LocationStockDrawerProps) {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [meta, setMeta] = useState<any>(null);

    useEffect(() => {
        if (locationId) {
            loadStock();
        } else {
            setItems([]);
            setMeta(null);
        }
    }, [locationId]);

    const loadStock = async () => {
        if (!locationId) return;
        setLoading(true);
        try {
            const res = await getLocationStock(locationId);
            // The API returns { data: [...], meta: { location: ..., total_items: ... } }
            // But based on my controller, I returned { data: [...], meta: ... } directly in the response body.
            // My ajax wrapper usually returns response.data.
            // Let's check api wrapper: unwrapArray might be tricky if I returned an object with data key inside.
            // Wait, my controller returns { status: 'ok', data: [...], meta: {...} }
            // api.get returns axios response.
            // api/locations.ts `expect` might obscure things if I used unwrapArray?
            // No, I just added `getLocationStock` which returns `res.data?.data`.
            // The controller returns `data => items`.
            // But I also want `meta`.
            // I should adjust the API call to return everything or just data.
            // For now let's assume `res` in component is the `data` array from controller.
            // Wait, if I used `res.data?.data`, I lose `meta` which is a sibling of `data` in JSON.

            // Let's fix the API function first if I want meta.
            // Actually, typically I might just want the list. 
            // I'll fetch it and see.
            setItems(res || []);
        } catch (error) {
            console.error("Failed to load location stock:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Sheet open={!!locationId} onOpenChange={(open) => !open && onClose()}>
            <SheetContent className="w-[800px] sm:w-[540px] overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Location Stock</SheetTitle>
                    <SheetDescription>
                        Current inventory items stored in this location.
                    </SheetDescription>
                </SheetHeader>

                <div className="mt-6">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : items.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground flex flex-col items-center gap-2">
                            <Package className="h-8 w-8 opacity-50" />
                            <p>No items found in this location.</p>
                        </div>
                    ) : (
                        <div className="border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>SKU</TableHead>
                                        <TableHead>Item</TableHead>
                                        <TableHead className="text-right">Qty</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">{item.sku}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span>{item.name}</span>
                                                    <span className="text-xs text-muted-foreground">{item.uom}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-lg">
                                                {item.qty}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
