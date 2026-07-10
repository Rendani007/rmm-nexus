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
import { listLocations } from '@/api/locations';
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
import { getDepartments } from '@/api/departments';
import { useAuthStore } from '@/features/auth/useAuthStore';
import type { Department } from '@/types';

interface ItemFormDialogProps {
  open: boolean;
  item?: InventoryItem | null;
  onClose: (reload?: boolean) => void;
  prefillBarcode?: string | null;
  enrichedData?: any;
}

type ItemFormData = {
  department_id?: string;
  stock_on_hand?: number;
  [key: string]: any;
};


export const ItemFormDialog = ({ open, item, onClose, prefillBarcode, enrichedData }: ItemFormDialogProps) => {
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

  const { user } = useAuthStore();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('');
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');

  // Fetch locations
  useEffect(() => {
    if (open) {
      listLocations().then(setLocations).catch(console.error);
    }
  }, [open]);

  const filteredLocations = selectedDepartmentId 
    ? locations.filter(loc => !loc.department_id || loc.department_id === selectedDepartmentId)
    : locations;

  // Sync selected location
  useEffect(() => {
    if (filteredLocations.length > 0) {
      const exists = filteredLocations.some(l => l.id === selectedLocationId);
      if (!exists) {
        setSelectedLocationId(filteredLocations[0].id);
      }
    } else {
      setSelectedLocationId('');
    }
  }, [filteredLocations, selectedLocationId]);

  useEffect(() => {
    if (user?.is_tenant_admin) {
      getDepartments().then((data: any) => {
        const depts = data.data || data;
        if (Array.isArray(depts)) {
          setDepartments(depts);
          if (depts.length > 0 && !selectedDepartmentId && !item) {
             setSelectedDepartmentId(depts[0].id);
          }
        }
      }).catch(console.error);
    } else if (user?.department_id) {
        setSelectedDepartmentId(user.department_id);
    }
  }, [user, item, selectedDepartmentId]);

  // Fetch custom fields definition based on selected department
  useEffect(() => {
    if (open) {
      const deptId = selectedDepartmentId || undefined;
      getCustomFields('inventory_item', deptId)
        .then(setCustomFields)
        .catch(console.error);
    }
  }, [open, selectedDepartmentId]);


  useEffect(() => {
    if (open && item) {
      setSelectedDepartmentId(item.department_id || '');
      
      const formValues: any = {};
      
      formValues['department_id'] = item.department_id || '';
      formValues['stock_on_hand'] = item.stock_on_hand ?? 0;
      
      customFields.forEach(f => {
         const key = f.field_key;
         const coreKey = key.replace(/_\d+$/, '');
         let val: any = undefined;
         
         if (['sku', 'name', 'category', 'uom', 'reorder_level'].includes(coreKey)) {
            val = (item as any)[coreKey];
         } else if (item.metadata) {
            let meta: Record<string, any> = {};
            try {
              meta = typeof item.metadata === 'string'
                ? JSON.parse(item.metadata)
                : (item.metadata || {});
            } catch (e) {
              console.error('Failed to parse metadata in form', e);
            }
            val = meta[key];
         }
         
         if (val !== undefined) {
             formValues[`custom_${key}`] = val;
         }
      });
      
      reset(formValues);

    } else if (open && !item) {
      const formValues: any = { 
        department_id: selectedDepartmentId || undefined
      };
      customFields.forEach(f => {
        if (f.type === 'boolean') {
           formValues[`custom_${f.field_key}`] = false;
        } else {
           formValues[`custom_${f.field_key}`] = '';
        }
        
        // Prefill barcode if passed from scanner
        if (prefillBarcode && (f.field_key === 'barcode' || f.field_key === 'sku')) {
            formValues[`custom_${f.field_key}`] = prefillBarcode;
        }

        // Prefill enriched data
        if (enrichedData) {
            if (f.field_key === 'name' && enrichedData.name) {
                formValues[`custom_${f.field_key}`] = enrichedData.name;
            }
            if (f.field_key === 'category' && enrichedData.category) {
                formValues[`custom_${f.field_key}`] = enrichedData.category;
            }
            if ((f.field_key === 'description' || f.field_key === 'notes') && enrichedData.description) {
                formValues[`custom_${f.field_key}`] = enrichedData.description;
            }
            if (f.field_key === 'brand' && enrichedData.brand) {
                formValues[`custom_${f.field_key}`] = enrichedData.brand;
            }
        }
      });
      reset(formValues);
    }
  }, [open, item, reset, customFields, selectedDepartmentId, prefillBarcode, enrichedData]);

  const onSubmit = async (data: ItemFormData) => {
    setLoading(true);
    try {
      const payload: any = {
        department_id: selectedDepartmentId || undefined,
        stock_on_hand: data.stock_on_hand !== undefined ? Number(data.stock_on_hand) : undefined,
        location_id: selectedLocationId || undefined,
        metadata: {},
      };

      customFields.forEach(field => {
        const val = data[`custom_${field.field_key}`];
        const key = field.field_key;
        
        // Strip out trailing numeric uniqueness counters generated by the backend (e.g. "name_1" -> "name")
        const coreKey = key.replace(/_\d+$/, '');

        let processedVal = val;
        if (field.type === 'boolean') processedVal = Boolean(val);
        else if (field.type === 'number' && val !== '' && val !== undefined) processedVal = Number(val);
        
        if (['sku', 'name', 'category', 'uom', 'reorder_level'].includes(coreKey)) {
             payload[coreKey] = processedVal;
        } else if (processedVal !== undefined && processedVal !== '') {
             payload.metadata[key] = processedVal;
        }
      });


      if (isEdit) {
        await updateItem(item.id, payload);
        toast({
          title: 'Item updated',
          description: 'The item has been updated successfully.',
        });
      } else {
        await createItem(payload);
        toast({
          title: 'Item created',
          description: 'The item has been created successfully.',
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
          {user?.is_tenant_admin && (
              <div className="space-y-2 pb-4 border-b">
                <Label htmlFor="department_id">Department</Label>
                <Select 
                    value={selectedDepartmentId} 
                    onValueChange={(val) => {
                        setSelectedDepartmentId(val);
                        // Changing department clears the form because fields might be totally different
                        reset({ department_id: val }); 
                    }}
                    disabled={isEdit} // Cannot change department after creation typically, or disable for simplicity
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map(d => (
                        <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">The department determines which attributes are available for this item.</p>
              </div>
          )}
          
          {customFields.length === 0 ? (
              <div className="text-sm text-center py-6 text-muted-foreground">
                  No attributes are defined for this department. Please define attributes in settings.
              </div>
          ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {customFields.sort((a,b) => a.sort_order - b.sort_order).map(renderCustomField)}
                
                <div className="space-y-2">
                  <Label htmlFor="stock_on_hand">Stock</Label>
                  <Input
                    id="stock_on_hand"
                    type="number"
                    {...register('stock_on_hand', { valueAsNumber: true })}
                    disabled={loading}
                    placeholder="0"
                  />
                </div>

                {filteredLocations.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="location_id">Stock Location</Label>
                    <Select 
                      value={selectedLocationId} 
                      onValueChange={setSelectedLocationId}
                      disabled={loading}
                    >
                      <SelectTrigger id="location_id">
                        <SelectValue placeholder="Select Location" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredLocations.map(loc => (
                          <SelectItem key={loc.id} value={String(loc.id)}>{loc.name} ({loc.code})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
          )}

          {Object.keys(errors).length > 0 && (
            <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm">
              <p className="font-semibold mb-1">Please fix the following errors:</p>
              <ul className="list-disc pl-5">
                {Object.entries(errors).map(([key, err]: any) => (
                  <li key={key}>{key}: {err.message}</li>
                ))}
              </ul>
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
