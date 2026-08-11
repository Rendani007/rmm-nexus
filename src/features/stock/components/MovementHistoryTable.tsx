import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Loader2, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { listStockMovements, deleteStockMovement } from '@/api/stock';
import { toast } from '@/hooks/use-toast';
import { useAuthStore } from '@/features/auth/useAuthStore';

export function MovementHistoryTable() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [movements, setMovements] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const { user } = useAuthStore();
  const isAdmin = user?.is_tenant_admin || user?.is_super_admin;

  const loadHistory = async (pageNum = 1) => {
    setHistoryLoading(true);
    try {
      const res = await listStockMovements({ page: pageNum });
      setMovements(res.data);
      setPage(res.current_page);
      setTotalPages(res.last_page);
    } catch (e) {
      console.error("Failed to load history", e);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadHistory(1);
  }, []);

  const handleDeleteMovement = async (id: string) => {
    if (!confirm('Are you sure you want to delete this stock movement? This action will dynamically recalculate stock totals and cannot be undone.')) return;
    try {
      await deleteStockMovement(id);
      toast({ title: 'Movement Deleted', description: 'Stock movement was successfully deleted and logged.' });
      loadHistory(page);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Deletion Failed', description: e.response?.data?.message || 'Could not delete movement.' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Movement History</CardTitle>
        <CardDescription>A record of all stock changes across the system.</CardDescription>
      </CardHeader>
      <CardContent>
        {historyLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin h-8 w-8 text-muted-foreground" /></div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    {isAdmin && <TableHead>User</TableHead>}
                    {isAdmin && <TableHead className="w-[50px]"></TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={isAdmin ? 7 : 6} className="text-center py-8 text-muted-foreground">
                        No movements found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    movements.map((m: any) => (
                      <TableRow key={m.id}>
                        <TableCell className="text-xs whitespace-nowrap">
                          {format(new Date(m.created_at), 'MMM d, yyyy HH:mm')}
                        </TableCell>
                        <TableCell className="font-medium">{m.item?.name}</TableCell>
                        <TableCell>
                          <Badge variant={m.type === 'in' ? 'default' : m.type === 'out' ? 'destructive' : 'secondary'}>
                            {m.type.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>{m.qty}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{m.from?.name || '-'}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{m.to?.name || m.destination || '-'}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{m.user?.first_name || '-'}</TableCell>
                        {isAdmin && (
                          <TableCell>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteMovement(m.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadHistory(page - 1)}
                disabled={page <= 1 || historyLoading}
              >Previous</Button>
              <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadHistory(page + 1)}
                disabled={page >= totalPages || historyLoading}
              >Next</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
