import { useState } from 'react';
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
import { stockTransfer } from '@/api/stock';
import { stockTransferSchema } from '@/lib/validation';
import type { InventoryItem, InventoryLocation, StockTransferBody } from '@/types';

type StockTransferFormProps = {
  items: InventoryItem[];
  locations: InventoryLocation[];
  loading: boolean;
};

export function StockTransferForm({
  items,
  locations,
  loading: loadingData,
}: StockTransferFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<StockTransferBody>({
    resolver: zodResolver(stockTransferSchema),
  });

  const fromLocationId = watch('from_location_id');

  const onSubmit = async (data: StockTransferBody) => {
    setLoading(true);
    setError('');
    try {
      await stockTransfer(data);
      toast({ title: 'Stock transferred', description: 'Stock transfer transaction recorded successfully.' });
      reset();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.response?.data?.error || 'We encountered a problem recording the stock transfer. Please try again.';
      setError(message);
      toast({ variant: 'destructive', title: 'Failed to record stock transfer', description: message });
    } finally {
      setLoading(false);
    }
  };

  const hasItems = Array.isArray(items) && items.length > 0;
  const hasLocs = Array.isArray(locations) && locations.length > 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>Transfer Stock (Internal)</CardTitle>
          <CardDescription>Move inventory between locations you own</CardDescription>
        </div>
        <Button variant="secondary" onClick={() => window.location.href = '/stock/request'}>
          Send to Another Department →
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

          <div className="space-y-2">
            <Label htmlFor="transfer-item">Item *</Label>
            <Select
              onValueChange={(value) => setValue('inventory_item_id', value)}
              disabled={loadingData || loading || !hasItems}
            >
              <SelectTrigger id="transfer-item"><SelectValue placeholder="Select item" /></SelectTrigger>
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

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="transfer-from">From Location *</Label>
              <Select
                onValueChange={(value) => setValue('from_location_id', value)}
                disabled={loadingData || loading || !hasLocs}
              >
                <SelectTrigger id="transfer-from"><SelectValue placeholder="Select location" /></SelectTrigger>
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

            <div className="space-y-2">
              <Label htmlFor="transfer-to">To Location *</Label>
              <Select
                onValueChange={(value) => setValue('to_location_id', value)}
                disabled={loadingData || loading || !fromLocationId || !hasLocs}
              >
                <SelectTrigger id="transfer-to"><SelectValue placeholder="Select location" /></SelectTrigger>
                <SelectContent>
                  {hasLocs &&
                    locations
                      .filter((loc) => String(loc.id) !== String(fromLocationId))
                      .map((loc) => (
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
              <Label htmlFor="transfer-qty">Quantity *</Label>
              <Input id="transfer-qty" type="number" min="1" {...register('qty')} disabled={loading} />
              {errors.qty && <p className="text-sm text-destructive">{errors.qty.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="transfer-reference">Reference</Label>
              <Input id="transfer-reference" placeholder="TR-12345" {...register('reference')} disabled={loading} />
              {errors.reference && <p className="text-sm text-destructive">{errors.reference.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="transfer-batch">Batch Number</Label>
            <Input id="transfer-batch" placeholder="Scan or type batch" {...register('batch_number')} disabled={loading} />
            {errors.batch_number && <p className="text-sm text-destructive">{errors.batch_number.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="transfer-note">Note</Label>
            <Textarea id="transfer-note" placeholder="Optional notes" {...register('note')} disabled={loading} rows={3} />
            {errors.note && <p className="text-sm text-destructive">{errors.note.message}</p>}
          </div>

          <Button type="submit" disabled={loading || loadingData}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Record Stock Transfer
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
