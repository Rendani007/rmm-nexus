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
import { stockIn } from '@/api/stock';
import { stockInSchema } from '@/lib/validation';
import type { InventoryItem, InventoryLocation, StockInBody } from '@/types';
import type { GS1Data } from '@/lib/gs1Parser';

type StockInFormProps = {
  items: InventoryItem[];
  locations: InventoryLocation[];
  loading: boolean;
  prefillItem?: InventoryItem;
  prefillGs1?: GS1Data;
};

export function StockInForm({
  items,
  locations,
  loading: loadingData,
  prefillItem,
  prefillGs1
}: StockInFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<StockInBody>({
    resolver: zodResolver(stockInSchema),
  });

  useEffect(() => {
    if (prefillItem) setValue('inventory_item_id', String(prefillItem.id));
    if (prefillGs1) {
       if (prefillGs1.batch) setValue('batch_number', prefillGs1.batch);
       if (prefillGs1.quantity) setValue('qty', prefillGs1.quantity);
       if (prefillGs1.expiry) {
           const yy = prefillGs1.expiry.substring(0, 2);
           const mm = prefillGs1.expiry.substring(2, 4);
           const dd = prefillGs1.expiry.substring(4, 6);
           const year = parseInt(yy, 10) > 50 ? `19${yy}` : `20${yy}`;
           setValue('expiry_date', `${year}-${mm}-${dd}`);
       }
    }
  }, [prefillItem, prefillGs1, setValue]);

  const onSubmit = async (data: StockInBody) => {
    setLoading(true);
    setError('');
    try {
      await stockIn(data);
      toast({ title: 'Stock received', description: 'Stock in transaction recorded successfully.' });
      reset();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.response?.data?.error || 'We encountered a problem recording the stock in. Please try again.';
      setError(message);
      toast({ variant: 'destructive', title: 'Failed to record stock in', description: message });
    } finally {
      setLoading(false);
    }
  };

  const hasItems = Array.isArray(items) && items.length > 0;
  const hasLocs = Array.isArray(locations) && locations.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Receive Stock</CardTitle>
        <CardDescription>Record incoming inventory to a location</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="in-item">Item *</Label>
              <Select
                onValueChange={(value) => setValue('inventory_item_id', value)}
                disabled={loadingData || loading || !hasItems}
                defaultValue={prefillItem ? String(prefillItem.id) : undefined}
              >
                <SelectTrigger id="in-item"><SelectValue placeholder="Select item" /></SelectTrigger>
                <SelectContent>
                  {hasItems &&
                    items.map((item) => (
                      <SelectItem key={item.id} value={String(item.id)}>
                        {item.sku} - {item.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {errors.inventory_item_id && <p className="text-sm text-destructive">{errors.inventory_item_id.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="in-location">To Location *</Label>
              <Select
                onValueChange={(value) => setValue('to_location_id', value)}
                disabled={loadingData || loading || !hasLocs}
              >
                <SelectTrigger id="in-location"><SelectValue placeholder="Select location" /></SelectTrigger>
                <SelectContent>
                  {hasLocs &&
                    locations.map((loc) => (
                      <SelectItem key={loc.id} value={String(loc.id)}>
                        {loc.code} - {loc.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {errors.to_location_id && <p className="text-sm text-destructive">{errors.to_location_id.message}</p>}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="in-qty">Quantity *</Label>
              <Input id="in-qty" type="number" min="1" {...register('qty')} disabled={loading} />
              {errors.qty && <p className="text-sm text-destructive">{errors.qty.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="in-reference">Reference</Label>
              <Input id="in-reference" placeholder="PO-12345" {...register('reference')} disabled={loading} />
              {errors.reference && <p className="text-sm text-destructive">{errors.reference.message}</p>}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="in-batch">Batch Number</Label>
              <Input id="in-batch" placeholder="Scan or type batch" {...register('batch_number')} disabled={loading} />
              {errors.batch_number && <p className="text-sm text-destructive">{errors.batch_number.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="in-expiry">Expiry Date</Label>
              <Input id="in-expiry" type="date" {...register('expiry_date')} disabled={loading} />
              {errors.expiry_date && <p className="text-sm text-destructive">{errors.expiry_date.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="in-note">Note</Label>
            <Textarea id="in-note" placeholder="Optional notes" {...register('note')} disabled={loading} rows={3} />
            {errors.note && <p className="text-sm text-destructive">{errors.note.message}</p>}
          </div>

          <Button type="submit" disabled={loading || loadingData}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Record Stock In
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
