import { useEffect, useState } from 'react';
import { Plus, Search, Pencil, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Layout } from '@/components/Layout';
import { toast } from '@/hooks/use-toast';
import { listLocations, deleteLocation } from '@/api/locations';
import { LocationFormDialog } from './LocationFormDialog';
import type { InventoryLocation } from '@/types';

/** Why: API often returns wrapped data; normalize to a plain array to avoid .map crashes */
function normalizeLocations(payload: unknown): InventoryLocation[] {
  if (Array.isArray(payload)) return payload as InventoryLocation[];
  const o = (payload ?? null) as Record<string, unknown> | null;
  if (!o) return [];
  if (Array.isArray(o.items)) return o.items as InventoryLocation[];
  if (Array.isArray(o.data)) return o.data as InventoryLocation[];
  if (Array.isArray((o as any).results)) return (o as any).results as InventoryLocation[];
  if (Array.isArray((o as any).rows)) return (o as any).rows as InventoryLocation[];
  return [];
}

export const LocationsListPage = () => {
  const [locations, setLocations] = useState<InventoryLocation[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<InventoryLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<InventoryLocation | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState<InventoryLocation | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadLocations = async () => {
    setLoading(true);
    try {
      const data = await listLocations();
      const normalized = normalizeLocations(data);
      setLocations(normalized);
      setFilteredLocations(normalized);
      if (!Array.isArray(data)) {
        console.debug('listLocations() returned a non-array; normalized to array.');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to load locations',
        description: error?.response?.data?.message || 'An error occurred',
      });
      setLocations([]);
      setFilteredLocations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLocations();
  }, []);

  useEffect(() => {
    if (!Array.isArray(locations)) return;
    const q = search.trim().toLowerCase();
    if (!q) {
      setFilteredLocations(locations);
      return;
    }
    const filtered = locations.filter((location) => {
      const name = location.name?.toLowerCase() || '';
      const code = location.code?.toLowerCase() || '';
      return name.includes(q) || code.includes(q);
    });
    setFilteredLocations(filtered);
  }, [search, locations]);

  const handleDelete = async () => {
    if (!locationToDelete) return;
    setDeleting(true);
    try {
      await deleteLocation(locationToDelete.id);
      toast({
        title: 'Location deleted',
        description: `${locationToDelete.name} has been deleted.`,
      });
      await loadLocations();
      setDeleteDialogOpen(false);
      setLocationToDelete(null);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to delete location',
        description: error?.response?.data?.message || 'An error occurred',
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleEdit = (location: InventoryLocation) => {
    setSelectedLocation(location);
    setFormOpen(true);
  };

  const handleFormClose = (reload?: boolean) => {
    setFormOpen(false);
    setSelectedLocation(null);
    if (reload) loadLocations();
  };

  const isArray = Array.isArray(filteredLocations);

  return (
    <Layout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Locations</h1>
            <p className="text-muted-foreground">Manage your storage locations</p>
          </div>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Location
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by code or name..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : !isArray ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Unexpected data shape received. Please try again.
                  </TableCell>
                </TableRow>
              ) : filteredLocations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    {search ? 'No locations found matching your search.' : 'No locations yet. Create your first location to get started.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredLocations.map((location) => (
                  <TableRow key={location.id}>
                    <TableCell className="font-medium">{location.code}</TableCell>
                    <TableCell>{location.name}</TableCell>
                    <TableCell>
                      {location.created_at
                        ? new Date(location.created_at).toLocaleDateString()
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(location)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setLocationToDelete(location);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <LocationFormDialog
        open={formOpen}
        location={selectedLocation}
        onClose={handleFormClose}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Location</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{locationToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};