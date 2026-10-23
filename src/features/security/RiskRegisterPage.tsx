import { useEffect, useState } from 'react';
import { Plus, Search, Pencil, Trash2, Loader2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Layout } from '@/components/Layout';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { getRisks, createRisk, updateRisk, deleteRisk } from '@/api/security';
import { listUsers } from '@/api/users';
import type { Risk, User } from '@/types';
import { format } from 'date-fns';

export const RiskRegisterPage = () => {
  const [risks, setRisks] = useState<Risk[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [risksData, usersData] = await Promise.all([getRisks(), listUsers()]);
      setRisks(risksData);
      const uList = (usersData as any).data || usersData;
      setUsers(uList as User[]);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error?.response?.data?.message || 'We could not load the risk register. Please try again later.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredRisks = risks.filter(r => 
    r.description.toLowerCase().includes(search.toLowerCase()) || 
    r.mitigation_plan.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateOrUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const data = {
      description: formData.get('description') as string,
      likelihood: parseInt(formData.get('likelihood') as string),
      impact: parseInt(formData.get('impact') as string),
      mitigation_plan: formData.get('mitigation_plan') as string,
      owner_id: formData.get('owner_id') as string,
      status: formData.get('status') as any,
      review_date: formData.get('review_date') as string,
    };

    try {
      if (selectedRisk) {
        await updateRisk(selectedRisk.id, data);
        toast({ title: 'Success', description: 'Risk entry updated' });
      } else {
        await createRisk(data);
        toast({ title: 'Success', description: 'Risk entry added' });
      }
      setDialogOpen(false);
      loadData();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error?.response?.data?.message || 'We encountered a problem saving the risk entry. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this risk entry?')) return;
    setDeletingId(id);
    try {
      await deleteRisk(id);
      toast({ title: 'Success', description: 'Risk entry removed' });
      loadData();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error?.response?.data?.message || 'We encountered a problem deleting the risk entry. Please try again.' });
    } finally {
      setDeletingId(null);
    }
  };

  const getRiskScoreBadge = (likelihood: number, impact: number) => {
    const score = likelihood * impact;
    if (score >= 15) return <Badge variant="destructive" className="bg-red-600">Critical ({score})</Badge>;
    if (score >= 9) return <Badge variant="destructive" className="bg-orange-500">High ({score})</Badge>;
    if (score >= 4) return <Badge variant="outline" className="border-amber-500 text-amber-500">Medium ({score})</Badge>;
    return <Badge variant="secondary">Low ({score})</Badge>;
  };

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6 w-full max-w-full min-w-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 w-full min-w-0">
          <div className="min-w-0 w-full">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2 tracking-tight text-foreground min-w-0">
              <AlertTriangle className="h-6 w-6 sm:h-7 sm:w-7 text-amber-500 shrink-0" />
              <span className="truncate sm:whitespace-normal">ISO 27001 Risk Register</span>
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm mt-1 break-words">Identify, assess, and mitigate information security risks.</p>
          </div>
          <Button onClick={() => { setSelectedRisk(null); setDialogOpen(true); }} className="w-full sm:w-auto min-h-[44px] shrink-0">
            <Plus className="mr-2 h-4 w-4" /> Add Risk Entry
          </Button>
        </div>

        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search risks..."
            className="pl-8 w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

      {/* Mobile Card View */}
      <div className="block md:hidden space-y-3">
        {loading ? (
          <div className="py-12 text-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
          </div>
        ) : filteredRisks.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
            {search ? 'No risks matching your search.' : 'No risks identified yet.'}
          </div>
        ) : (
          filteredRisks.map((risk) => (
            <div key={risk.id} className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {getRiskScoreBadge(risk.likelihood, risk.impact)}
                  <Badge variant={risk.status === 'accepted' ? 'secondary' : 'outline'} className="text-xs uppercase">
                    {risk.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" className="h-9 w-9 p-0" onClick={() => { setSelectedRisk(risk); setDialogOpen(true); }}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(risk.id)} disabled={deletingId === risk.id}>
                    {deletingId === risk.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <p className="font-semibold text-base text-foreground leading-snug">
                {risk.description}
              </p>

              {risk.mitigation_plan && (
                <div className="bg-muted/40 p-2.5 rounded-lg border border-border/50 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">Mitigation: </span>
                  {risk.mitigation_plan}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50 text-xs text-muted-foreground">
                <div>
                  <span className="text-muted-foreground">Matrix: </span>
                  <span className="font-medium text-foreground">{risk.likelihood} × {risk.impact}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Owner: </span>
                  <span className="font-medium text-foreground">{risk.owner ? `${risk.owner.first_name} ${risk.owner.last_name}` : 'Unassigned'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Next Review: </span>
                  <span className="font-medium text-foreground">{format(new Date(risk.review_date), 'PPP')}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block rounded-md border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Description</TableHead>
              <TableHead>L x I</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Next Review</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : filteredRisks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No risks identified yet.
                </TableCell>
              </TableRow>
            ) : (
              filteredRisks.map((risk) => (
                <TableRow key={risk.id}>
                  <TableCell className="font-medium max-w-[300px] truncate" title={risk.description}>
                    {risk.description}
                  </TableCell>
                  <TableCell>{risk.likelihood} x {risk.impact}</TableCell>
                  <TableCell>{getRiskScoreBadge(risk.likelihood, risk.impact)}</TableCell>
                  <TableCell>{risk.owner?.first_name} {risk.owner?.last_name}</TableCell>
                  <TableCell>
                    <Badge variant={risk.status === 'accepted' ? 'secondary' : 'outline'}>
                      {risk.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>{format(new Date(risk.review_date), 'PPP')}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => { setSelectedRisk(risk); setDialogOpen(true); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(risk.id)} disabled={deletingId === risk.id}>
                      {deletingId === risk.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{selectedRisk ? 'Edit Risk Entry' : 'Add New Risk Entry'}</DialogTitle>
            <DialogDescription>
              Assess the risk using Likelihood (1-5) and Impact (1-5).
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateOrUpdate} className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="description">Risk Description</Label>
              <Input id="description" name="description" required defaultValue={selectedRisk?.description} placeholder="e.g. Unauthorised database access" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="likelihood">Likelihood (1-5)</Label>
                <Select name="likelihood" defaultValue={selectedRisk?.likelihood?.toString() || '3'}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map(v => <SelectItem key={v} value={v.toString()}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="impact">Impact (1-5)</Label>
                <Select name="impact" defaultValue={selectedRisk?.impact?.toString() || '3'}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map(v => <SelectItem key={v} value={v.toString()}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="mitigation_plan">Mitigation & Controls</Label>
              <Textarea id="mitigation_plan" name="mitigation_plan" required defaultValue={selectedRisk?.mitigation_plan} placeholder="Steps taken to reduce this risk..." />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="owner_id">Risk Owner</Label>
                <Select name="owner_id" defaultValue={selectedRisk?.owner_id}>
                  <SelectTrigger><SelectValue placeholder="Select owner" /></SelectTrigger>
                  <SelectContent>
                    {users.map(u => <SelectItem key={u.id} value={u.id}>{u.first_name} {u.last_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Risk Status</Label>
                <Select name="status" defaultValue={selectedRisk?.status || 'identified'}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="identified">Identified</SelectItem>
                    <SelectItem value="managed">Managed</SelectItem>
                    <SelectItem value="residual">Residual</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="review_date">Next Review Date</Label>
              <Input id="review_date" name="review_date" type="date" required defaultValue={selectedRisk?.review_date ? format(new Date(selectedRisk.review_date), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd")} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {selectedRisk ? 'Update' : 'Add Entry'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      </div>
    </Layout>
  );
};
