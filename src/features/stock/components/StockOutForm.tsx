import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { stockOut, getAvailableBatches, getStockBalance } from '@/api/stock';
import { stockOutSchema } from '@/lib/validation';
import type { InventoryItem, InventoryLocation, StockOutBody } from '@/types';

type StockOutFormProps = {
  items: InventoryItem[];
  locations: InventoryLocation[];
  loading: boolean;
};

export function StockOutForm({
  items,
  locations,
  loading: loadingData,
}: StockOutFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [batches, setBatches] = useState<{batch_number: string, available: number}[]>([]);
  const [localAvailable, setLocalAvailable] = useState<number | null>(null);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<StockOutBody>({
    resolver: zodResolver(stockOutSchema),
  });

  const selectedItem = items.find(i => String(i.id) === selectedItemId);
  const globalAvailableStock = selectedItem?.stock_on_hand ?? null;

  const watchItemId = watch('inventory_item_id');
  const watchLocId = watch('from_location_id');

  useEffect(() => {
    if (watchItemId && watchLocId) {
      getAvailableBatches(watchItemId, watchLocId).then(setBatches).catch(() => setBatches([]));
      getStockBalance(watchItemId, watchLocId).then(setLocalAvailable).catch(() => setLocalAvailable(null));
    } else {
      setBatches([]);
      setLocalAvailable(null);
    }
  }, [watchItemId, watchLocId]);

  const onSubmit = async (data: StockOutBody) => {
    setLoading(true);
    setError('');
    try {
      const response = await stockOut(data);

      // Check for low-stock warning from backend
      const warning = response?.data?.low_stock_warning;
      if (warning) {
        toast({
          variant: 'destructive',
          title: '⚠️ Low Stock Warning',
          description: `${warning.message} (${warning.current_stock} remaining, reorder at ${warning.reorder_level})`,
        });
      }

      toast({ title: 'Stock issued', description: 'Stock out transaction recorded successfully.' });
      reset();
      setSelectedItemId('');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      const respData = error?.response?.data;
      let message = respData?.message || respData?.error || 'We encountered a problem recording the stock out. Please try again.';
      if (respData?.available !== undefined) {
        message = `Insufficient stock: only ${respData.available} available, you requested ${respData.requested}`;
      }
      setError(message);
      toast({ variant: 'destructive', title: 'Failed to record stock out', description: message });
    } finally {
      setLoading(false);
    }
  };

  const hasItems = Array.isArray(items) && items.length > 0;
  const hasLocs = Array.isArray(locations) && locations.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Issue Stock</CardTitle>
        <CardDescription>Record outgoing inventory from a location</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="out-item">Item *</Label>
              <Select
                onValueChange={(value) => {
                  setValue('inventory_item_id', value);
                  setSelectedItemId(value);
                }}
                disabled={loadingData || loading || !hasItems}
              >
                <SelectTrigger id="out-item"><SelectValue placeholder="Select item" /></SelectTrigger>
                <SelectContent>
                  {hasItems &&
                    items.map((item) => (
                      <SelectItem key={item.id} value={String(item.id)}>
                        {item.sku} - {item.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {watchLocId && localAvailable !== null ? (
                <p className={`text-sm font-medium ${localAvailable <= 0 ? 'text-destructive' : 'text-emerald-600'}`}>
                  Available in Location: {localAvailable} units
                </p>
              ) : globalAvailableStock !== null ? (
                <p className={`text-sm font-medium ${globalAvailableStock <= 0 ? 'text-destructive' : 'text-emerald-600'}`}>
                  Available Globally: {globalAvailableStock} units
                </p>
              ) : null}
              {errors.inventory_item_id && <p className="text-sm text-destructive">{errors.inventory_item_id.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="out-location">From Location *</Label>
              <Select
                onValueChange={(value) => setValue('from_location_id', value)}
                disabled={loadingData || loading || !hasLocs}
              >
                <SelectTrigger id="out-location"><SelectValue placeholder="Select location" /></SelectTrigger>
                <SelectContent>
                  {hasLocs &&
                    locations.map((loc) => (
                      <SelectItem key={loc.id} value={String(loc.id)}>
                        {loc.code} - {loc.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {errors.from_location_id && <p className="text-sm text-destructive">{errors.from_location_id.message}</p>}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="out-qty">Quantity *</Label>
              <Input id="out-qty" type="number" min="1" {...register('qty')} disabled={loading} />
              {errors.qty && <p className="text-sm text-destructive">{errors.qty.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="out-reference">Reference</Label>
              <Input id="out-reference" placeholder="Auto-generated if empty" {...register('reference')} disabled={loading} />
              {errors.reference && <p className="text-sm text-destructive">{errors.reference.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="out-destination">Destination / Where to?</Label>
            <Input id="out-destination" placeholder="e.g., Client name, Site location, Job card" {...register('destination')} disabled={loading} />
            {errors.destination && <p className="text-sm text-destructive">{errors.destination.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="out-batch">Batch Number</Label>
            <Select
              onValueChange={(value) => setValue('batch_number', value)}
              disabled={loadingData || loading || batches.length === 0}
            >
              <SelectTrigger id="out-batch">
                <SelectValue placeholder={batches.length > 0 ? "Select batch" : "No batches available"} />
              </SelectTrigger>
              <SelectContent>
                {batches.map((b) => (
                  <SelectItem key={b.batch_number} value={b.batch_number}>
                    {b.batch_number} (Qty: {b.available})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.batch_number && <p className="text-sm text-destructive">{errors.batch_number.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="out-note">Note</Label>
            <Textarea id="out-note" placeholder="Optional notes" {...register('note')} disabled={loading} rows={3} />
            {errors.note && <p className="text-sm text-destructive">{errors.note.message}</p>}
          </div>

          <Button type="submit" disabled={loading || loadingData}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Record Stock Out
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
