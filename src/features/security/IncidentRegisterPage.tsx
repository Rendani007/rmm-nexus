import { useEffect, useState } from 'react';
import { Plus, Search, Pencil, Trash2, Loader2, AlertCircle, ShieldAlert } from 'lucide-react';
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
import { getIncidents, createIncident, updateIncident, deleteIncident } from '@/api/security';
import type { Incident } from '@/types';
import { format } from 'date-fns';
import { Layout } from '@/components/Layout';

export const IncidentRegisterPage = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadIncidents = async () => {
    try {
      const data = await getIncidents();
      setIncidents(data);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error?.response?.data?.message || 'We could not load the incident register. Please try again later.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIncidents();
  }, []);

  const filteredIncidents = incidents.filter(i => 
    i.title.toLowerCase().includes(search.toLowerCase()) || 
    i.description.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateOrUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      severity: formData.get('severity') as any,
      status: formData.get('status') as any,
      reported_at: formData.get('reported_at') as string,
    };

    try {
      if (selectedIncident) {
        await updateIncident(selectedIncident.id, data);
        toast({ title: 'Success', description: 'Incident updated successfully' });
      } else {
        await createIncident(data);
        toast({ title: 'Success', description: 'Incident reported successfully' });
      }
      setDialogOpen(false);
      loadIncidents();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error?.response?.data?.message || 'We encountered a problem saving the incident. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this incident record?')) return;
    setDeletingId(id);
    try {
      await deleteIncident(id);
      toast({ title: 'Success', description: 'Incident deleted' });
      loadIncidents();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error?.response?.data?.message || 'We encountered a problem deleting the incident. Please try again.' });
    } finally {
      setDeletingId(null);
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical': return <Badge variant="destructive">Critical</Badge>;
      case 'high': return <Badge variant="destructive" className="bg-orange-500">High</Badge>;
      case 'medium': return <Badge variant="outline" className="border-amber-500 text-amber-500">Medium</Badge>;
      default: return <Badge variant="secondary">Low</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved': return <Badge className="bg-green-500 text-white">Resolved</Badge>;
      case 'closed': return <Badge variant="secondary">Closed</Badge>;
      case 'investigating': return <Badge className="bg-blue-500 text-white">Investigating</Badge>;
      default: return <Badge variant="outline">Open</Badge>;
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <ShieldAlert className="h-8 w-8 text-primary shrink-0" />
              <span>Security Incident Register</span>
            </h1>
            <p className="text-muted-foreground mt-1">Track and manage security incidents for compliance.</p>
          </div>
          <Button onClick={() => { setSelectedIncident(null); setDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Report Incident
          </Button>
        </div>

      <div className="flex items-center gap-4 max-w-sm">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search incidents..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border bg-card overflow-x-auto pb-4">
        <Table className="min-w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap">Date Reported</TableHead>
              <TableHead className="whitespace-nowrap">Title</TableHead>
              <TableHead className="whitespace-nowrap">Severity</TableHead>
              <TableHead className="whitespace-nowrap">Status</TableHead>
              <TableHead className="whitespace-nowrap">Reporter</TableHead>
              <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : filteredIncidents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No incidents recorded.
                </TableCell>
              </TableRow>
            ) : (
              filteredIncidents.map((incident) => (
                <TableRow key={incident.id}>
                  <TableCell className="whitespace-nowrap">{format(new Date(incident.reported_at), 'PPP')}</TableCell>
                  <TableCell className="font-medium whitespace-nowrap">{incident.title}</TableCell>
                  <TableCell className="whitespace-nowrap">{getSeverityBadge(incident.severity)}</TableCell>
                  <TableCell className="whitespace-nowrap">{getStatusBadge(incident.status)}</TableCell>
                  <TableCell className="whitespace-nowrap">{incident.reporter?.first_name} {incident.reporter?.last_name}</TableCell>
                  <TableCell className="text-right space-x-2 whitespace-nowrap">
                    <Button variant="ghost" size="icon" onClick={() => { setSelectedIncident(incident); setDialogOpen(true); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(incident.id)} disabled={deletingId === incident.id}>
                      {deletingId === incident.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedIncident ? 'Edit Incident' : 'Report Security Incident'}</DialogTitle>
            <DialogDescription>
              Record the details of the security event for ISO 27001 audit trails.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateOrUpdate} className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" required defaultValue={selectedIncident?.title} placeholder="e.g. Lost device, Unauthorised login" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description & Impact</Label>
              <Textarea id="description" name="description" required defaultValue={selectedIncident?.description} placeholder="Describe what happened and what was affected..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="severity">Severity</Label>
                <Select name="severity" defaultValue={selectedIncident?.severity || 'medium'}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select name="status" defaultValue={selectedIncident?.status || 'open'}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="investigating">Investigating</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reported_at">Reported At</Label>
              <Input id="reported_at" name="reported_at" type="datetime-local" required defaultValue={selectedIncident?.reported_at ? format(new Date(selectedIncident.reported_at), "yyyy-MM-dd'T'HH:mm") : format(new Date(), "yyyy-MM-dd'T'HH:mm")} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {selectedIncident ? 'Update Record' : 'Submit Report'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      </div>
    </Layout>
  );
};
