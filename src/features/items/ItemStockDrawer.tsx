import { useEffect, useState } from 'react';
import { Loader2, MapPin, Package, ArrowRight, ArrowLeft } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { listStockMovements } from '@/api/stock';
import { stockForItem } from '@/api/items';
import { getCustomFields } from '@/api/customFields';
import type { InventoryItem, StockSummary, CustomFieldDefinition } from '@/types';
import { format } from 'date-fns';

interface ItemStockDrawerProps {
  open: boolean;
  item: InventoryItem | null;
  onClose: () => void;
}

export const ItemStockDrawer = ({ open, item, onClose }: ItemStockDrawerProps) => {
  const [stock, setStock] = useState<StockSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [customFields, setCustomFields] = useState<CustomFieldDefinition[]>([]);

  // History state
  const [movements, setMovements] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (open) {
      getCustomFields('inventory_item').then(setCustomFields).catch(console.error);
    }
  }, [open]);

  useEffect(() => {
    const loadStock = async () => {
      if (!item || !open) return;

      setLoading(true);
      try {
        const data = await stockForItem(item.id);
        setStock(data);
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Failed to load stock',
          description: error.response?.data?.message || 'An error occurred',
        });
      } finally {
        setLoading(false);
      }
    };

    loadStock();
  }, [item, open]);

  // Load history when tab changes or item opens
  const loadHistory = async () => {
    if (!item) return;
    setHistoryLoading(true);
    try {
      const res = await listStockMovements({ inventory_item_id: item.id });
      setMovements(res.data);
    } catch (error) {
      console.error("Failed to load history", error);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Safe metadata parsing
  let metadata: Record<string, any> = {};
  if (item?.metadata) {
    try {
      metadata = typeof item.metadata === 'string'
        ? JSON.parse(item.metadata)
        : (item.metadata || {});
    } catch (e) {
      console.error('Failed to parse metadata', e);
    }
  }

  const getLabel = (key: string, fallback: string) =>
    customFields.find(f => f.field_key === key)?.label || fallback;

  // Filter out Name from details grid as it's the title
  const detailFields = customFields
    .filter(f => f.field_key !== 'name') // Keep SKU maybe?
    .sort((a, b) => a.sort_order - b.sort_order);

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        className="w-full sm:max-w-xl" // Slightly wider for history table
        onInteractOutside={(e) => {
          e.preventDefault();
        }}
      >
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {item?.name}
          </SheetTitle>
          <SheetDescription>
            {getLabel('sku', 'SKU')}: {item?.sku} | {getLabel('uom', 'UoM')}: {item?.uom}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 h-full">
          <Tabs defaultValue="overview" className="h-full" onValueChange={(val) => val === 'history' && loadHistory()}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : stock ? (
                <>
                  <div className="rounded-lg border bg-card p-4 space-y-4">
                    <h3 className="font-semibold text-sm">Item Details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      {detailFields.map(field => {
                        const val = field.is_system
                          ? (item as any)?.[field.field_key]
                          : metadata[field.field_key];

                        return (
                          <div key={field.id} className="space-y-1">
                            <span className="text-muted-foreground text-xs block uppercase tracking-wider">{field.label}</span>
                            <span className="font-medium block break-words">{val?.toString() || '-'}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="rounded-lg border bg-card p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-muted-foreground">
                        Total Stock
                      </div>
                      <Badge variant="secondary" className="text-lg font-bold">
                        {stock.total} {item?.uom}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-sm font-medium">Stock by Location</h3>
                    {stock.stock_by_location.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-8 text-center">
                        No stock in any location
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {stock.stock_by_location.map((loc) => (
                          <div
                            key={loc.location_id}
                            className="flex items-center justify-between rounded-lg border p-3"
                          >
                            <div className="flex items-center gap-3">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <div className="font-medium">{loc.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {loc.code}
                                </div>
                              </div>
                            </div>
                            <Badge variant="outline">
                              {loc.qty} {item?.uom}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {item?.reorder_level !== undefined && (
                    <>
                      <Separator />
                      <div className="rounded-lg border bg-muted/50 p-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Reorder Level:</span>
                          <span className="font-medium">
                            {item.reorder_level} {item.uom}
                          </span>
                        </div>
                        {stock.total < item.reorder_level && (
                          <p className="mt-2 text-sm text-warning">
                            ⚠️ Stock is below reorder level
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <p className="text-center text-sm text-muted-foreground py-12">
                  No stock information available
                </p>
              )}
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              {historyLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : movements.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-12">
                  No stock history found.
                </p>
              ) : (
                <div className="rounded-md border h-[60vh] overflow-y-auto">
                  <Table>
                    <TableHeader className="bg-muted/50 sticky top-0">
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>User</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {movements.map((m: any) => (
                        <TableRow key={m.id}>
                          <TableCell className="text-xs whitespace-nowrap">
                            {format(new Date(m.created_at), 'MMM d, yyyy HH:mm')}
                          </TableCell>
                          <TableCell>
                            <Badge variant={m.type === 'in' ? 'default' : m.type === 'out' ? 'destructive' : 'secondary'}>
                              {m.type.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            {m.qty}
                          </TableCell>
                          <TableCell className="text-xs">
                            {m.type === 'transfer' ? (
                              <div className="flex items-center gap-1">
                                {m.from?.name} <ArrowRight className="h-3 w-3" /> {m.to?.name}
                              </div>
                            ) : m.type === 'in' ? (
                              m.to?.name
                            ) : (
                              m.from?.name
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {m.user?.first_name}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
};
