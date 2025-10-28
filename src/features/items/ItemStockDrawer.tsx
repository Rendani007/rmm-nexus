import { useEffect, useState } from 'react';
import { Loader2, MapPin, Package } from 'lucide-react';
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
import { stockForItem } from '@/api/items';
import type { InventoryItem, StockSummary } from '@/types';

interface ItemStockDrawerProps {
  open: boolean;
  item: InventoryItem | null;
  onClose: () => void;
}

export const ItemStockDrawer = ({ open, item, onClose }: ItemStockDrawerProps) => {
  const [stock, setStock] = useState<StockSummary | null>(null);
  const [loading, setLoading] = useState(false);

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

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {item?.name}
          </SheetTitle>
          <SheetDescription>
            SKU: {item?.sku} | UoM: {item?.uom}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : stock ? (
            <>
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
        </div>
      </SheetContent>
    </Sheet>
  );
};
