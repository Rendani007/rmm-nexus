import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { createItem, updateItem } from '@/api/items';
import { itemSchema } from '@/lib/validation';
import type { InventoryItem } from '@/types';

interface ItemFormDialogProps {
  open: boolean;
  item?: InventoryItem | null;
  onClose: (reload?: boolean) => void;
}

type ItemFormData = {
  sku: string;
  name: string;
  category?: string;
  uom: string;
  reorder_level?: number;
  metadata?: string;
};

export const ItemFormDialog = ({ open, item, onClose }: ItemFormDialogProps) => {
  const [loading, setLoading] = useState(false);
  const isEdit = !!item;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ItemFormData>({
    resolver: zodResolver(itemSchema),
  });

  useEffect(() => {
    if (open && item) {
      reset({
        sku: item.sku,
        name: item.name,
        category: item.category || '',
        uom: item.uom,
        reorder_level: item.reorder_level,
        metadata: item.metadata ? JSON.stringify(item.metadata, null, 2) : '',
      });
    } else if (open && !item) {
      reset({
        sku: '',
        name: '',
        category: '',
        uom: '',
        reorder_level: undefined,
        metadata: '',
      });
    }
  }, [open, item, reset]);

  const onSubmit = async (data: ItemFormData) => {
    setLoading(true);
    try {
      const payload: any = {
        sku: data.sku,
        name: data.name,
        category: data.category || undefined,
        uom: data.uom,
        reorder_level: data.reorder_level || undefined,
      };

      if (data.metadata?.trim()) {
        try {
          payload.metadata = JSON.parse(data.metadata);
        } catch (e) {
          toast({
            variant: 'destructive',
            title: 'Invalid JSON',
            description: 'Metadata must be valid JSON',
          });
          setLoading(false);
          return;
        }
      }

      if (isEdit) {
        await updateItem(item.id, payload);
        toast({
          title: 'Item updated',
          description: `${data.name} has been updated.`,
        });
      } else {
        await createItem(payload);
        toast({
          title: 'Item created',
          description: `${data.name} has been created.`,
        });
      }

      onClose(true);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: isEdit ? 'Failed to update item' : 'Failed to create item',
        description: error.response?.data?.message || 'An error occurred',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Item' : 'New Item'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update item details below.' : 'Add a new inventory item.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sku">SKU *</Label>
              <Input
                id="sku"
                {...register('sku')}
                disabled={loading}
                placeholder="ITEM-001"
              />
              {errors.sku && (
                <p className="text-sm text-destructive">{errors.sku.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="uom">Unit of Measure *</Label>
              <Input
                id="uom"
                {...register('uom')}
                disabled={loading}
                placeholder="EA, KG, L, etc."
              />
              {errors.uom && (
                <p className="text-sm text-destructive">{errors.uom.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              {...register('name')}
              disabled={loading}
              placeholder="Item name"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                {...register('category')}
                disabled={loading}
                placeholder="Optional"
              />
              {errors.category && (
                <p className="text-sm text-destructive">{errors.category.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reorder_level">Reorder Level</Label>
              <Input
                id="reorder_level"
                type="number"
                {...register('reorder_level')}
                disabled={loading}
                placeholder="0"
              />
              {errors.reorder_level && (
                <p className="text-sm text-destructive">{errors.reorder_level.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="metadata">Metadata (JSON)</Label>
            <Textarea
              id="metadata"
              {...register('metadata')}
              disabled={loading}
              placeholder='{"key": "value"}'
              rows={4}
              className="font-mono text-sm"
            />
            {errors.metadata && (
              <p className="text-sm text-destructive">{errors.metadata.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onClose()} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
