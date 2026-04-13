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
import { createLocation, updateLocation } from '@/api/locations';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { locationSchema } from '@/lib/validation';
import { getDepartments } from '@/api/departments';
import { useAuthStore } from '@/features/auth/useAuthStore';
import type { InventoryLocation, Department } from '@/types';


interface LocationFormDialogProps {
  open: boolean;
  location?: InventoryLocation | null;
  onClose: (reload?: boolean) => void;
}

type LocationFormData = {
  department_id?: string;
  code: string;
  name: string;
};

export const LocationFormDialog = ({ open, location, onClose }: LocationFormDialogProps) => {
  const [loading, setLoading] = useState(false);
  const isEdit = !!location;
  const { user } = useAuthStore();
  const [departments, setDepartments] = useState<Department[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,

    formState: { errors },
  } = useForm<LocationFormData>({
    resolver: zodResolver(locationSchema),
  });

  useEffect(() => {
    if (user?.is_tenant_admin) {
      getDepartments().then((data: any) => {
        const depts = data?.data?.data ?? data?.data ?? data;
        if (Array.isArray(depts)) {
          setDepartments(depts);
        }
      }).catch(console.error);
    }
  }, [user]);

  useEffect(() => {
    if (open && location) {
      reset({
        code: location.code,
        name: location.name,
        department_id: location.department_id || undefined,
      });
    } else if (open && !location) {
      reset({
        code: '',
        name: '',
        department_id: user?.department_id || undefined,
      });
    }
  }, [open, location, reset, user]);


  const onSubmit = async (data: LocationFormData) => {
    setLoading(true);
    try {
      if (isEdit) {
        await updateLocation(location.id, data);
        toast({
          title: 'Location updated',
          description: `${data.name} has been updated.`,
        });
      } else {
        await createLocation(data);
        toast({
          title: 'Location created',
          description: `${data.name} has been created.`,
        });
      }

      onClose(true);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: isEdit ? 'Failed to update location' : 'Failed to create location',
        description: error.response?.data?.message || 'An error occurred',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Location' : 'New Location'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update location details below.' : 'Add a new storage location.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {user?.is_tenant_admin && (
              <div className="space-y-2">
                <Label htmlFor="department_id">Department (Optional)</Label>
                <Select 
                    value={watch('department_id') || ''} 
                    onValueChange={(val) => setValue('department_id', val === 'none' ? undefined : val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Global (No Department)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Global (No Department)</SelectItem>
                    {departments.map(d => (
                        <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Isolates this location to a specific department.</p>
              </div>
          )}

          <div className="space-y-2">

            <Label htmlFor="code">Code *</Label>
            <Input
              id="code"
              {...register('code')}
              disabled={loading}
              placeholder="WH-A01"
            />
            {errors.code && (
              <p className="text-sm text-destructive">{errors.code.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              {...register('name')}
              disabled={loading}
              placeholder="Warehouse A - Aisle 01"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
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
