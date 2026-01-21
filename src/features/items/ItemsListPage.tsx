import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Eye, Pencil, Trash2, Loader2, Download, Upload } from 'lucide-react';
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
import { listItems, deleteItem, downloadExport } from '@/api/items';
import { ItemFormDialog } from './ItemFormDialog';
import { ItemStockDrawer } from './ItemStockDrawer';
import { ImportItemsDialog } from './ImportItemsDialog';
import { getCustomFields } from '@/api/customFields';
import type { InventoryItem, CustomFieldDefinition } from '@/types';

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
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [stockDrawerOpen, setStockDrawerOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);
  const [customFields, setCustomFields] = useState<CustomFieldDefinition[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const fetchFieldDefs = async () => {
    try {
      const defs = await getCustomFields('inventory_item');
      setCustomFields(defs);
    } catch (e) {
      console.error('Failed to load field definitions', e);
    }
  };

  const loadItems = async () => {
    setLoading(true);
    try {
      const data = await listItems();
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
    loadItems();
    fetchFieldDefs();
  }, []);

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
        item.name.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        item.category?.toLowerCase().includes(q)
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
    setDeleting(true);
    try {
      await deleteItem(itemToDelete.id);
      toast({
        title: 'Item deleted',
        description: `${itemToDelete.name} has been deleted.`,
      });
      await loadItems();
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to delete item',
        description: error?.response?.data?.message || 'An error occurred',
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await downloadExport();
      toast({ title: 'Export started', description: 'Your CSV file is downloading.' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Export failed' });
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
    if (reload) loadItems();
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
              <Download className="mr-2 h-4 w-4" />
              {exporting ? 'Exporting...' : 'Export'}
            </Button>
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

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, SKU, or category..."
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
                <TableHead>Stock</TableHead>
                {customFields
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map((field) => (
                    <TableHead key={field.id}>{field.label}</TableHead>
                  ))}
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={customFields.length + 1} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : !isArray ? (
                <TableRow>
                  <TableCell colSpan={customFields.length + 1} className="text-center py-8 text-muted-foreground">
                    Unexpected data shape received. Please try again.
                  </TableCell>
                </TableRow>
              ) : filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={customFields.length + 1} className="text-center py-8 text-muted-foreground">
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

                        const value = field.is_system
                          ? (item as any)[field.field_key]
                          : meta[field.field_key];

                        return (
                          <TableCell
                            key={field.id}
                            className={field.field_key === 'sku' ? 'font-medium' : ''}
                          >
                            {value?.toString() || '-'}
                          </TableCell>
                        );
                      })}
                    <TableCell>
                      {item.stock_on_hand ?? 0}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
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
      />

      <ImportItemsDialog
        open={importDialogOpen}
        onClose={handleImportClose}
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
    </Layout>
  );
};