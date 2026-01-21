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
import { locationSchema } from '@/lib/validation';
import type { InventoryLocation } from '@/types';

interface LocationFormDialogProps {
  open: boolean;
  location?: InventoryLocation | null;
  onClose: (reload?: boolean) => void;
}

type LocationFormData = {
  code: string;
  name: string;
};

export const LocationFormDialog = ({ open, location, onClose }: LocationFormDialogProps) => {
  const [loading, setLoading] = useState(false);
  const isEdit = !!location;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LocationFormData>({
    resolver: zodResolver(locationSchema),
  });

  useEffect(() => {
    if (open && location) {
      reset({
        code: location.code,
        name: location.name,
      });
    } else if (open && !location) {
      reset({
        code: '',
        name: '',
      });
    }
  }, [open, location, reset]);

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
