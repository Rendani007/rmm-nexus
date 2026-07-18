import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, Search, Eye, Pencil, Trash2, Loader2, Download, Upload, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { listItems, deleteItem, downloadExport, bulkDeleteItems } from '@/api/items';
import { ItemFormDialog } from './ItemFormDialog';
import { ItemStockDrawer } from './ItemStockDrawer';
import { ImportItemsDialog } from './ImportItemsDialog';
import { BarcodeGeneratorModal } from '../inventory/components/BarcodeGeneratorModal';
import { UpgradeModal } from '@/components/ui/UpgradeModal';
import { getCustomFields } from '@/api/customFields';
import { getDepartments } from '@/api/departments';
import { useAuthStore } from '@/features/auth/useAuthStore';
import type { InventoryItem, CustomFieldDefinition, Department } from '@/types';



function normalizeItems(payload: unknown): InventoryItem[] {
  if (Array.isArray(payload)) return payload as InventoryItem[];
  const maybeObj = payload as Record<string, unknown> | null;
  if (maybeObj && Array.isArray(maybeObj.items)) return maybeObj.items as InventoryItem[];
  if (maybeObj && Array.isArray(maybeObj.data)) return maybeObj.data as InventoryItem[];
  if (maybeObj && typeof maybeObj === 'object') {
    if (Array.isArray((maybeObj as any).results)) return (maybeObj as any).results as InventoryItem[];
    if (Array.isArray((maybeObj as any).rows)) return (maybeObj as any).rows as InventoryItem[];
  }
  return [];
}

export const ItemsListPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialSearch = queryParams.get('search') || '';
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialSearch);
  const [formOpen, setFormOpen] = useState(false);
  const [stockDrawerOpen, setStockDrawerOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);
  const [customFields, setCustomFields] = useState<CustomFieldDefinition[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('');
  const [deleting, setDeleting] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [prefillBarcode, setPrefillBarcode] = useState<string | null>(null);
  const [enrichedData, setEnrichedData] = useState<any>(null);
  const [generatorOpen, setGeneratorOpen] = useState(false);
  const [generatorItems, setGeneratorItems] = useState<InventoryItem[]>([]);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const { user, tenant } = useAuthStore();

  const handlePrintRequest = (itemsToPrint: InventoryItem[]) => {
    if (tenant?.plan === 'starter') {
      setUpgradeModalOpen(true);
    } else {
      setGeneratorItems(itemsToPrint);
      setGeneratorOpen(true);
    }
  };

  useEffect(() => {
    // Check if we navigated here from scanner with a prefilled barcode
    const state = location.state as any;
    if (state?.openCreateModal && state?.prefillBarcode) {
        setPrefillBarcode(state.prefillBarcode);
        setEnrichedData(state.enrichedData || null);
        setFormOpen(true);
        // Clear state so it doesn't reopen on refresh
        navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const newSearch = queryParams.get('search');
    if (newSearch !== null) {
      setSearch(newSearch);
    }
  }, [location.search]);

  useEffect(() => {
    if (user?.is_tenant_admin) {
      getDepartments().then((data: any) => {
        // Backend returns paginated: { status, data: { data: [...], current_page, ... } }
        const depts = data?.data?.data ?? data?.data ?? data;
        if (Array.isArray(depts)) {
          setDepartments(depts);
        }
      }).catch(console.error);
    } else if (user?.department_id) {
        setSelectedDepartmentId(user.department_id);
    }
  }, [user]);

  const fetchFieldDefs = async () => {
    try {
      const deptId = selectedDepartmentId || undefined;
      const defs = await getCustomFields('inventory_item', deptId);
      console.log('[ItemsListPage] Custom Fields Loaded:', defs);
      setCustomFields(defs);
    } catch (e) {
      console.error('Failed to load field definitions', e);
    }
  };

  const loadItems = async () => {
    if (items.length === 0) setLoading(true);
    try {
      const qs = selectedDepartmentId ? `?department_id=${selectedDepartmentId}` : '';
      const data = await listItems(qs); // Assumes listItems accepts optional query string. If not, we might need a params object.

      const normalized = normalizeItems(data);
      setItems(normalized);
      setFilteredItems(normalized);
    } catch (error: any) {
      console.error('[items] load error:', error?.response?.data || error);
      setItems([]);
      setFilteredItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Always load items once we know who the user is.
    // For tenants admins selectedDepartmentId may be set,
    // for other users it may be empty — both cases should still fetch.
    if (user !== undefined) {
      loadItems();
      fetchFieldDefs();
    }
  }, [selectedDepartmentId, user]);


  useEffect(() => {
    if (!Array.isArray(items)) return;
    const q = search.trim().toLowerCase();
    if (!q) {
      setFilteredItems(items);
      return;
    }
    const filtered = items.filter((item) => {
      // Check core fields first
      if (
        (item.name?.toLowerCase() || '').includes(q) ||
        (item.sku?.toLowerCase() || '').includes(q) ||
        (item.category?.toLowerCase() || '').includes(q)
      ) return true;

      // Check custom fields
      return customFields.some((field) => {
        const value = field.is_system
          ? (item as any)[field.field_key]
          : (item.metadata as any)?.[field.field_key];

        return value?.toString().toLowerCase().includes(q);
      });
    });
    setFilteredItems(filtered);
  }, [search, items, customFields]);

  const handleDelete = async () => {
    if (!itemToDelete) return;
    
    const id = itemToDelete.id;
    const name = itemToDelete.name;
    
    // Close dialog and start optimistic updates
    setDeleteDialogOpen(false);
    setItemToDelete(null);

    const prevItems = [...items];
    const prevFiltered = [...filteredItems];
    
    setItems(prev => prev.filter(i => i.id !== id));
    setFilteredItems(prev => prev.filter(i => i.id !== id));

    try {
      await deleteItem(id);
      toast({
        title: 'Item deleted',
        description: `${name} has been deleted.`,
      });
      loadItems(); // Background refresh
    } catch (error: any) {
      // Revert optimism
      setItems(prevItems);
      setFilteredItems(prevFiltered);
      toast({
        variant: 'destructive',
        title: 'Failed to delete item',
        description: error?.response?.data?.message || 'We encountered a problem deleting the item. Please try again.',
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (filteredItems.length === 0) return;
    setDeleting(true);
    try {
      const ids = filteredItems.map(i => i.id);
      await bulkDeleteItems(ids);
      toast({
        title: 'Bulk delete successful',
        description: `Deleted ${ids.length} items.`,
      });
      loadItems();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to delete items',
        description: error?.response?.data?.message || 'We encountered a problem deleting the items. Please try again.',
      });
    } finally {
      setDeleting(false);
      setBulkDeleteDialogOpen(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await downloadExport();
      toast({ title: 'Export started', description: 'Your CSV file is downloading.' });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Export failed', description: e?.response?.data?.message || 'We could not export the items at this time. Please try again.' });
    } finally {
      setExporting(false);
    }
  };

  const handleEdit = (item: InventoryItem) => {
    setSelectedItem(item);
    setFormOpen(true);
  };

  const handleViewStock = (item: InventoryItem) => {
    setSelectedItem(item);
    setStockDrawerOpen(true);
  };

  const handleFormClose = (reload?: boolean) => {
    setFormOpen(false);
    setSelectedItem(null);
    if (reload) loadItems();
  };

  const handleImportClose = (reload?: boolean) => {
    setImportDialogOpen(false);
    if (reload) {
      loadItems();
      fetchFieldDefs();
    }
  };

  const isArray = Array.isArray(filteredItems);

  return (
    <Layout>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Items</h1>
            <p className="text-muted-foreground">Manage your inventory items</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => navigate('/admin/settings/attributes')}>
              Attributes
            </Button>
            <Button variant="outline" onClick={handleExport} disabled={exporting}>
              {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              {exporting ? 'Exporting...' : 'Export'}
            </Button>
            {filteredItems.length > 0 && (
              <>
                <Button variant="outline" onClick={() => handlePrintRequest(filteredItems)}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print Visible
                </Button>
                <Button variant="destructive" onClick={() => setBulkDeleteDialogOpen(true)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Visible
                </Button>
              </>
            )}
            <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Import
            </Button>
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Item
            </Button>
          </div>


        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2 justify-between">
          <div className="relative flex-1 w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, SKU, or category..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {user?.is_tenant_admin && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">Department:</span>
              <Select
                value={selectedDepartmentId || '__all__'}
                onValueChange={(val) => setSelectedDepartmentId(val === '__all__' ? '' : val)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Departments</SelectItem>
                  {departments.map(d => (
                    <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>


        <div className="rounded-md border overflow-x-auto pb-4">
          <Table className="min-w-full">
            <TableHeader>
              <TableRow>
                {customFields
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map((field) => (
                    <TableHead key={field.id} className="whitespace-nowrap">{field.label}</TableHead>
                  ))}
                <TableHead className="whitespace-nowrap">Stock</TableHead>

                <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={customFields.length + 2} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : !isArray ? (
                <TableRow>
                  <TableCell colSpan={customFields.length + 2} className="text-center py-8 text-muted-foreground">
                    Unexpected data shape received. Please try again.
                  </TableCell>
                </TableRow>
              ) : filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={customFields.length + 2} className="text-center py-8 text-muted-foreground">
                    {search ? 'No items found matching your search.' : 'No items yet. Create your first item to get started.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    {customFields
                      .sort((a, b) => a.sort_order - b.sort_order)
                      .map((field) => {
                        let meta: Record<string, any> = {};
                        try {
                          meta = typeof item.metadata === 'string'
                            ? JSON.parse(item.metadata)
                            : (item.metadata || {});
                        } catch (e) {
                          console.error('Failed to parse metadata', e);
                        }

                        const coreKey = field.field_key.replace(/_\d+$/, '');
                        const isCoreField = ['sku', 'name', 'category', 'uom', 'reorder_level'].includes(coreKey);

                        const value = isCoreField || field.is_system
                          ? (item as any)[coreKey]
                          : meta[field.field_key];

                        let displayContent: React.ReactNode = value?.toString() || '-';
                        
                        if (field.type === 'boolean') {
                          // Handle string 'true'/'false', actual booleans, and 1/0
                          const isTruthy = value === true || value === 'true' || value === 1 || value === '1' || value === 'Yes';
                          const isFalsy = value === false || value === 'false' || value === 0 || value === '0' || value === 'No';
                          
                          if (isTruthy) {
                              displayContent = <Badge variant="default" className="bg-green-600 hover:bg-green-700">Yes</Badge>;
                          } else if (isFalsy) {
                              displayContent = <Badge variant="secondary" className="text-muted-foreground">No</Badge>;
                          } else {
                              displayContent = <span className="text-muted-foreground">-</span>;
                          }
                        }

                        return (
                          <TableCell
                            key={field.id}
                            className={field.field_key === 'sku' ? 'font-medium whitespace-nowrap' : 'whitespace-nowrap'}
                          >
                            {displayContent}
                          </TableCell>
                        );
                      })}
                    <TableCell className="whitespace-nowrap">
                      {item.stock_on_hand ?? 0}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handlePrintRequest([item])}
                        >
                          <Printer className="h-4 w-4 text-slate-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewStock(item)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(item)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setItemToDelete(item);
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

      <ItemFormDialog
        open={formOpen}
        item={selectedItem}
        onClose={handleFormClose}
        prefillBarcode={prefillBarcode}
        enrichedData={enrichedData}
      />

      <ImportItemsDialog
        open={importDialogOpen}
        departmentId={selectedDepartmentId}
        onClose={handleImportClose}
      />

      <BarcodeGeneratorModal 
        open={generatorOpen}
        items={generatorItems}
        onClose={() => setGeneratorOpen(false)}
      />

      <UpgradeModal 
        open={upgradeModalOpen} 
        onOpenChange={setUpgradeModalOpen} 
        title="Upgrade to Professional"
        description="Barcode printing and hardware scanner support are premium features designed to scale your warehouse operations. Upgrade your plan to unlock these and more."
      />

      <ItemStockDrawer
        open={stockDrawerOpen}
        item={selectedItem}
        onClose={() => {
          setStockDrawerOpen(false);
          setSelectedItem(null);
        }}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{itemToDelete?.name}"? This action cannot be undone.
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

      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Visible Items</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {filteredItems.length} items? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <BarcodeGeneratorModal 
        isOpen={generatorOpen} 
        onClose={() => {
          setGeneratorOpen(false);
          setGeneratorItems([]);
        }} 
        items={generatorItems} 
      />
    </Layout>
  );
};