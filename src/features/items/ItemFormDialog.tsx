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
import { toast } from '@/hooks/use-toast';
import { createItem, updateItem } from '@/api/items';
import { getCustomFields } from '@/api/customFields';
import { itemSchema } from '@/lib/validation';
import type { InventoryItem, CustomFieldDefinition } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

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
  // Dynamic fields will be collected separately
  [key: string]: any;
};

export const ItemFormDialog = ({ open, item, onClose }: ItemFormDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [customFields, setCustomFields] = useState<CustomFieldDefinition[]>([]);
  const isEdit = !!item;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ItemFormData>({
    resolver: zodResolver(itemSchema),
  });

  // Fetch custom fields definition
  useEffect(() => {
    if (open) {
      getCustomFields('inventory_item')
        .then(setCustomFields)
        .catch(console.error);
    }
  }, [open]);

  useEffect(() => {
    if (open && item) {
      // 1. Standard fields
      reset({
        sku: item.sku,
        name: item.name,
        category: item.category || '',
        uom: item.uom,
        reorder_level: item.reorder_level,
      });

      // 2. Custom fields (stored in metadata)
      if (item.metadata) {
        let meta: Record<string, any> = {};
        try {
          meta = typeof item.metadata === 'string'
            ? JSON.parse(item.metadata)
            : (item.metadata || {});
        } catch (e) {
          console.error('Failed to parse metadata in form', e);
        }

        Object.entries(meta).forEach(([key, value]) => {
          setValue(`custom_${key}`, value);
        });
      }

    } else if (open && !item) {
      reset({
        sku: '',
        name: '',
        category: '',
        uom: '',
        reorder_level: undefined,
      });
      // Clear custom fields
      // Clear custom fields
      customFields.forEach(f => {
        if (f.type === 'boolean') {
          setValue(`custom_${f.field_key}`, false);
        } else if (f.type === 'select') {
          setValue(`custom_${f.field_key}`, '');
        } else {
          setValue(`custom_${f.field_key}`, '');
        }
      });
    }
  }, [open, item, reset, customFields, setValue]);

  const onSubmit = async (data: ItemFormData) => {
    setLoading(true);
    try {
      // 1. Extract standard fields
      const payload: any = {
        sku: data.sku,
        name: data.name,
        category: data.category || undefined,
        uom: data.uom,
        reorder_level: data.reorder_level || undefined,
        metadata: {},
      };

      // 2. Extract custom fields using definitions
      customFields.forEach(field => {
        const val = data[`custom_${field.field_key}`];

        // Explicitly handle boolean false as valid value
        if (field.type === 'boolean') {
          payload.metadata[field.field_key] = Boolean(val);
        }
        else if (val !== undefined && val !== '') {
          if (field.type === 'number') {
            payload.metadata[field.field_key] = Number(val);
          } else {
            payload.metadata[field.field_key] = val;
          }
        }
      });

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
      const errorData = error.response?.data;
      let errorMessage = errorData?.message || 'An error occurred';

      if (errorData?.errors) {
        const details = Object.values(errorData.errors).flat().join(', ');
        errorMessage += `: ${details}`;
      } else if (errorData?.details) {
        // handle custom error format if any
        const details = typeof errorData.details === 'object'
          ? Object.values(errorData.details).flat().join(', ')
          : errorData.details;
        errorMessage += `: ${details}`;
      }

      toast({
        variant: 'destructive',
        title: isEdit ? 'Failed to update item' : 'Failed to create item',
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const getFieldDef = (key: string) => customFields.find(f => f.field_key === key);

  const renderCustomField = (field: CustomFieldDefinition) => {
    // Only render truly custom fields (not system ones) in the additional details section
    if (field.is_system) return null;

    const fieldName = `custom_${field.field_key}`;

    if (field.type === 'select' && field.options) {
      const currentVal = watch(fieldName);
      return (
        <div key={field.id} className="space-y-2">
          <Label htmlFor={fieldName}>{field.label}</Label>
          <Select onValueChange={(val) => setValue(fieldName, val)} value={currentVal || ""}>
            <SelectTrigger>
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {Array.isArray(field.options) && field.options.map((opt: any) => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    if (field.type === 'boolean') {
      const isChecked = watch(fieldName);
      return (
        <div key={field.id} className="flex items-center space-x-2">
          <Switch
            id={fieldName}
            checked={!!isChecked}
            onCheckedChange={(val) => setValue(fieldName, val)}
          />
          <Label htmlFor={fieldName}>{field.label}</Label>
        </div>
      );
    }

    return (
      <div key={field.id} className="space-y-2">
        <Label htmlFor={fieldName}>{field.label}</Label>
        <Input
          id={fieldName}
          type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
          {...register(fieldName)}
          disabled={loading}
        />
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        onInteractOutside={(e) => {
          e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Item' : 'New Item'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update item details below.' : 'Add a new inventory item.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sku">
                {getFieldDef('sku')?.label ?? 'SKU'} {getFieldDef('sku')?.is_required ? '*' : ''}
              </Label>
              <Input
                id="sku"
                {...register('sku')}
                disabled={loading}
                placeholder={getFieldDef('sku')?.label ?? 'SKU'}
              />
              {errors.sku && (
                <p className="text-sm text-destructive">{errors.sku.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="uom">
                {getFieldDef('uom')?.label ?? 'Unit of Measure'} {getFieldDef('uom')?.is_required ? '*' : ''}
              </Label>
              <Input
                id="uom"
                {...register('uom')}
                disabled={loading}
                placeholder={getFieldDef('uom')?.label ?? 'Unit of Measure'}
              />
              {errors.uom && (
                <p className="text-sm text-destructive">{errors.uom.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">
              {getFieldDef('name')?.label ?? 'Name'} {getFieldDef('name')?.is_required ? '*' : ''}
            </Label>
            <Input
              id="name"
              {...register('name')}
              disabled={loading}
              placeholder={getFieldDef('name')?.label ?? 'Name'}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">
                {getFieldDef('category')?.label ?? 'Category'} {getFieldDef('category')?.is_required ? '*' : ''}
              </Label>
              <Input
                id="category"
                {...register('category')}
                disabled={loading}
                placeholder={getFieldDef('category')?.label ?? 'Optional'}
              />
              {errors.category && (
                <p className="text-sm text-destructive">{errors.category.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reorder_level">
                {getFieldDef('reorder_level')?.label ?? 'Reorder Level'} {getFieldDef('reorder_level')?.is_required ? '*' : ''}
              </Label>
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

          {/* Dynamic Sections (Only non-system custom fields) */}
          {customFields.filter(f => !f.is_system).length > 0 && (
            <div className="border-t pt-4">
              <h4 className="mb-4 text-sm font-medium text-muted-foreground">Additional Details</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {customFields.map(renderCustomField)}
              </div>
            </div>
          )}

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
