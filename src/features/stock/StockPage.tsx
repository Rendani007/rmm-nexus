import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, ArrowDown, ArrowUp, ArrowLeftRight } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { stockIn, stockOut, stockTransfer } from '@/api/stock';
import { listItems } from '@/api/items';
import { listLocations } from '@/api/locations';
import { stockInSchema, stockOutSchema, stockTransferSchema } from '@/lib/validation';
import type { InventoryItem, InventoryLocation, StockInBody, StockOutBody, StockTransferBody } from '@/types';

export const StockPage = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [locations, setLocations] = useState<InventoryLocation[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [itemsData, locationsData] = await Promise.all([
          listItems(),
          listLocations(),
        ]);
        setItems(itemsData);
        setLocations(locationsData);
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Failed to load data',
          description: error.response?.data?.message || 'An error occurred',
        });
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, []);

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stock Movements</h1>
          <p className="text-muted-foreground">
            Record stock in, out, and transfer transactions
          </p>
        </div>

        <Tabs defaultValue="in" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="in">
              <ArrowDown className="mr-2 h-4 w-4" />
              Stock In
            </TabsTrigger>
            <TabsTrigger value="out">
              <ArrowUp className="mr-2 h-4 w-4" />
              Stock Out
            </TabsTrigger>
            <TabsTrigger value="transfer">
              <ArrowLeftRight className="mr-2 h-4 w-4" />
              Transfer
            </TabsTrigger>
          </TabsList>

          <TabsContent value="in" className="mt-6">
            <StockInForm items={items} locations={locations} loading={loadingData} />
          </TabsContent>

          <TabsContent value="out" className="mt-6">
            <StockOutForm items={items} locations={locations} loading={loadingData} />
          </TabsContent>

          <TabsContent value="transfer" className="mt-6">
            <StockTransferForm items={items} locations={locations} loading={loadingData} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

function StockInForm({ items, locations, loading: loadingData }: { items: InventoryItem[]; locations: InventoryLocation[]; loading: boolean }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<StockInBody>({
    resolver: zodResolver(stockInSchema),
  });

  const onSubmit = async (data: StockInBody) => {
    setLoading(true);
    setError('');
    try {
      await stockIn(data);
      toast({
        title: 'Stock received',
        description: 'Stock in transaction recorded successfully.',
      });
      reset();
    } catch (error: any) {
      const message = error.response?.data?.message || error.response?.data?.error || 'An error occurred';
      setError(message);
      toast({
        variant: 'destructive',
        title: 'Failed to record stock in',
        description: message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Receive Stock</CardTitle>
        <CardDescription>Record incoming inventory to a location</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="in-item">Item *</Label>
              <Select
                onValueChange={(value) => setValue('inventory_item_id', value)}
                disabled={loadingData || loading}
              >
                <SelectTrigger id="in-item">
                  <SelectValue placeholder="Select item" />
                </SelectTrigger>
                <SelectContent>
                  {items.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.sku} - {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.inventory_item_id && (
                <p className="text-sm text-destructive">{errors.inventory_item_id.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="in-location">To Location *</Label>
              <Select
                onValueChange={(value) => setValue('to_location_id', value)}
                disabled={loadingData || loading}
              >
                <SelectTrigger id="in-location">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.code} - {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.to_location_id && (
                <p className="text-sm text-destructive">{errors.to_location_id.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="in-qty">Quantity *</Label>
              <Input
                id="in-qty"
                type="number"
                min="1"
                {...register('qty')}
                disabled={loading}
              />
              {errors.qty && (
                <p className="text-sm text-destructive">{errors.qty.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="in-reference">Reference</Label>
              <Input
                id="in-reference"
                placeholder="PO-12345"
                {...register('reference')}
                disabled={loading}
              />
              {errors.reference && (
                <p className="text-sm text-destructive">{errors.reference.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="in-note">Note</Label>
            <Textarea
              id="in-note"
              placeholder="Optional notes"
              {...register('note')}
              disabled={loading}
              rows={3}
            />
            {errors.note && (
              <p className="text-sm text-destructive">{errors.note.message}</p>
            )}
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

function StockOutForm({ items, locations, loading: loadingData }: { items: InventoryItem[]; locations: InventoryLocation[]; loading: boolean }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<StockOutBody>({
    resolver: zodResolver(stockOutSchema),
  });

  const onSubmit = async (data: StockOutBody) => {
    setLoading(true);
    setError('');
    try {
      await stockOut(data);
      toast({
        title: 'Stock issued',
        description: 'Stock out transaction recorded successfully.',
      });
      reset();
    } catch (error: any) {
      const message = error.response?.data?.message || error.response?.data?.error || 'An error occurred';
      setError(message);
      toast({
        variant: 'destructive',
        title: 'Failed to record stock out',
        description: message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Issue Stock</CardTitle>
        <CardDescription>Record outgoing inventory from a location</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="out-item">Item *</Label>
              <Select
                onValueChange={(value) => setValue('inventory_item_id', value)}
                disabled={loadingData || loading}
              >
                <SelectTrigger id="out-item">
                  <SelectValue placeholder="Select item" />
                </SelectTrigger>
                <SelectContent>
                  {items.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.sku} - {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.inventory_item_id && (
                <p className="text-sm text-destructive">{errors.inventory_item_id.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="out-location">From Location *</Label>
              <Select
                onValueChange={(value) => setValue('from_location_id', value)}
                disabled={loadingData || loading}
              >
                <SelectTrigger id="out-location">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.code} - {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.from_location_id && (
                <p className="text-sm text-destructive">{errors.from_location_id.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="out-qty">Quantity *</Label>
              <Input
                id="out-qty"
                type="number"
                min="1"
                {...register('qty')}
                disabled={loading}
              />
              {errors.qty && (
                <p className="text-sm text-destructive">{errors.qty.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="out-reference">Reference</Label>
              <Input
                id="out-reference"
                placeholder="SO-12345"
                {...register('reference')}
                disabled={loading}
              />
              {errors.reference && (
                <p className="text-sm text-destructive">{errors.reference.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="out-note">Note</Label>
            <Textarea
              id="out-note"
              placeholder="Optional notes"
              {...register('note')}
              disabled={loading}
              rows={3}
            />
            {errors.note && (
              <p className="text-sm text-destructive">{errors.note.message}</p>
            )}
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

function StockTransferForm({ items, locations, loading: loadingData }: { items: InventoryItem[]; locations: InventoryLocation[]; loading: boolean }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<StockTransferBody>({
    resolver: zodResolver(stockTransferSchema),
  });

  const fromLocationId = watch('from_location_id');

  const onSubmit = async (data: StockTransferBody) => {
    setLoading(true);
    setError('');
    try {
      await stockTransfer(data);
      toast({
        title: 'Stock transferred',
        description: 'Stock transfer transaction recorded successfully.',
      });
      reset();
    } catch (error: any) {
      const message = error.response?.data?.message || error.response?.data?.error || 'An error occurred';
      setError(message);
      toast({
        variant: 'destructive',
        title: 'Failed to record stock transfer',
        description: message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transfer Stock</CardTitle>
        <CardDescription>Move inventory between locations</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="transfer-item">Item *</Label>
            <Select
              onValueChange={(value) => setValue('inventory_item_id', value)}
              disabled={loadingData || loading}
            >
              <SelectTrigger id="transfer-item">
                <SelectValue placeholder="Select item" />
              </SelectTrigger>
              <SelectContent>
                {items.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.sku} - {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.inventory_item_id && (
              <p className="text-sm text-destructive">{errors.inventory_item_id.message}</p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="transfer-from">From Location *</Label>
              <Select
                onValueChange={(value) => setValue('from_location_id', value)}
                disabled={loadingData || loading}
              >
                <SelectTrigger id="transfer-from">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.code} - {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.from_location_id && (
                <p className="text-sm text-destructive">{errors.from_location_id.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="transfer-to">To Location *</Label>
              <Select
                onValueChange={(value) => setValue('to_location_id', value)}
                disabled={loadingData || loading || !fromLocationId}
              >
                <SelectTrigger id="transfer-to">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations
                    .filter((loc) => loc.id !== fromLocationId)
                    .map((loc) => (
                      <SelectItem key={loc.id} value={loc.id}>
                        {loc.code} - {loc.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {errors.to_location_id && (
                <p className="text-sm text-destructive">{errors.to_location_id.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="transfer-qty">Quantity *</Label>
              <Input
                id="transfer-qty"
                type="number"
                min="1"
                {...register('qty')}
                disabled={loading}
              />
              {errors.qty && (
                <p className="text-sm text-destructive">{errors.qty.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="transfer-reference">Reference</Label>
              <Input
                id="transfer-reference"
                placeholder="TR-12345"
                {...register('reference')}
                disabled={loading}
              />
              {errors.reference && (
                <p className="text-sm text-destructive">{errors.reference.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="transfer-note">Note</Label>
            <Textarea
              id="transfer-note"
              placeholder="Optional notes"
              {...register('note')}
              disabled={loading}
              rows={3}
            />
            {errors.note && (
              <p className="text-sm text-destructive">{errors.note.message}</p>
            )}
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
