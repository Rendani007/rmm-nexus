import { useEffect, useState } from 'react';
import { Plus, Search, Pencil, Trash2, Loader2, Package } from 'lucide-react';
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
import { LocationStockDrawer } from './LocationStockDrawer';
import { useAuthStore } from '@/features/auth/useAuthStore';
import type { InventoryLocation } from '@/types';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  const [drawerLocationId, setDrawerLocationId] = useState<string | null>(null);
  const { user } = useAuthStore();


  const loadLocations = async () => {
    if (locations.length === 0) setLoading(true);
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
    const locId = locationToDelete.id;
    const locName = locationToDelete.name;
    
    // Close dialog and optimistic UI
    setDeleteDialogOpen(false);
    setLocationToDelete(null);

    const previousLocations = [...locations];
    setLocations((prev) => prev.filter((l) => l.id !== locId));
    setFilteredLocations((prev) => prev.filter((l) => l.id !== locId));

    try {
      await deleteLocation(locId);
      toast({
        title: 'Location deleted',
        description: `${locName} has been deleted.`,
      });
      loadLocations(); // Background refresh
    } catch (error: any) {
      // Revert optimism
      setLocations(previousLocations);
      setFilteredLocations(previousLocations);
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
      <div className="space-y-4 sm:space-y-6 w-full max-w-full min-w-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 w-full min-w-0">
          <div className="min-w-0 w-full">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Locations</h1>
            <p className="text-muted-foreground text-xs sm:text-sm mt-1 break-words">Manage your storage locations</p>
          </div>
          {(user?.is_tenant_admin || user?.role === 'department_admin') && (
            <Button onClick={() => setFormOpen(true)} className="w-full sm:w-auto min-h-[44px] shrink-0">
              <Plus className="mr-2 h-4 w-4" />
              New Location
            </Button>
          )}
        </div>

        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by code or name..."
            className="pl-8 w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Mobile Cards View */}
        <div className="block md:hidden space-y-3">
          {loading ? (
            <div className="py-12 text-center text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              Loading locations...
            </div>
          ) : !isArray ? (
            <div className="p-8 text-center text-sm text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
              Unexpected data shape received. Please try again.
            </div>
          ) : filteredLocations.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
              {search ? 'No locations found matching your search.' : 'No locations yet. Create your first location to get started.'}
            </div>
          ) : (
            filteredLocations.map((location) => (
              <div key={location.id} className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-semibold bg-muted px-2 py-0.5 rounded text-foreground">
                        {location.code}
                      </span>
                    </div>
                    <h3 className="font-semibold text-base text-foreground mt-1 leading-snug">
                      {location.name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1">
                    {(user?.is_tenant_admin || user?.role === 'department_admin') && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 w-9 p-0"
                          onClick={() => handleEdit(location)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 w-9 p-0 text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            setLocationToDelete(location);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/50 text-xs">
                  <span className="text-muted-foreground">
                    {location.created_at ? new Date(location.created_at).toLocaleDateString() : '—'}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs font-medium"
                    onClick={() => setDrawerLocationId(location.id)}
                  >
                    <Package className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                    View Stock
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block rounded-md border overflow-x-auto">
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
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDrawerLocationId(location.id)}
                              >
                                <Package className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>View Stock</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        {(user?.is_tenant_admin || user?.role === 'department_admin') && (
                          <div className="flex gap-1">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEdit(location)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Edit Location</p>
                                </TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
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
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Delete Location</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        )}
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

      <LocationStockDrawer
        locationId={drawerLocationId}
        onClose={() => setDrawerLocationId(null)}
      />
    </Layout>
  );
};