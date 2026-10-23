import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Building2, Phone, Mail, FileText, MoreVertical, Pencil, Trash } from "lucide-react";
import { supplierApi } from "@/api/suppliers";
import { Supplier } from "@/types/procurement";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export function SuppliersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  
  const queryClient = useQueryClient();
  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ["suppliers"],
    queryFn: supplierApi.getSuppliers,
  });

  const deleteMutation = useMutation({
    mutationFn: supplierApi.deleteSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast({ title: "Supplier deleted", description: "The supplier has been removed." });
    },
  });

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (s.contact_person && s.contact_person.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6 w-full max-w-full min-w-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 w-full min-w-0">
        <div className="min-w-0 w-full">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Suppliers</h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1 break-words">Manage your vendor directory and B-BBEE compliance.</p>
        </div>
        <Button onClick={() => { setEditingSupplier(null); setIsModalOpen(true); }} className="bg-indigo-600 hover:bg-indigo-700 text-white w-full sm:w-auto min-h-[44px] shrink-0">
          <Plus className="mr-2 h-4 w-4" /> Add Supplier
        </Button>
      </div>

      <Card className="glass-panel border-border/50">
        <CardHeader className="border-b border-border/50 pb-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search suppliers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:max-w-sm border-0 bg-transparent focus-visible:ring-0 px-0"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Mobile Card List View */}
          <div className="block md:hidden divide-y divide-border/50">
            {isLoading ? (
              <div className="p-8 text-center text-sm text-muted-foreground">Loading suppliers...</div>
            ) : filteredSuppliers.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">No suppliers found.</div>
            ) : (
              filteredSuppliers.map((supplier) => (
                <div key={supplier.id} className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-xl bg-indigo-600/10 flex items-center justify-center text-indigo-600 shrink-0">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-base text-foreground leading-snug">{supplier.name}</h3>
                        {supplier.contact_person && (
                          <p className="text-xs text-muted-foreground">{supplier.contact_person}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Badge variant={supplier.is_active ? "default" : "secondary"} className={supplier.is_active ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-0 text-xs" : "text-xs"}>
                        {supplier.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="glass-strong border-border/50 w-40">
                          <DropdownMenuItem className="cursor-pointer min-h-[40px]" onClick={() => { setEditingSupplier(supplier); setIsModalOpen(true); }}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive min-h-[40px]" onClick={() => deleteMutation.mutate(supplier.id)}>
                            <Trash className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 text-xs text-muted-foreground pl-11">
                    {supplier.address && (
                      <p className="text-muted-foreground truncate">{supplier.address}</p>
                    )}
                    {supplier.email && (
                      <a href={`mailto:${supplier.email}`} className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1.5 truncate">
                        <Mail className="h-3 w-3 shrink-0" /> {supplier.email}
                      </a>
                    )}
                    {supplier.phone && (
                      <a href={`tel:${supplier.phone}`} className="hover:text-foreground flex items-center gap-1.5">
                        <Phone className="h-3 w-3 shrink-0" /> {supplier.phone}
                      </a>
                    )}
                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      {supplier.bbbee_level && (
                        <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/20 py-0">
                          B-BBEE Level {supplier.bbbee_level}
                        </Badge>
                      )}
                      {supplier.tax_number && (
                        <span className="font-mono text-muted-foreground">Tax: {supplier.tax_number}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-muted/30 text-muted-foreground border-b border-border/50">
                <tr>
                  <th className="px-6 py-4 font-medium">Supplier</th>
                  <th className="px-6 py-4 font-medium">Contact</th>
                  <th className="px-6 py-4 font-medium">Compliance (SA)</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">Loading suppliers...</td>
                  </tr>
                ) : filteredSuppliers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">No suppliers found.</td>
                  </tr>
                ) : (
                  filteredSuppliers.map((supplier) => (
                    <tr key={supplier.id} className="hover:bg-muted/10 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-indigo-600/10 flex items-center justify-center text-indigo-600 shrink-0">
                            <Building2 className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{supplier.name}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">{supplier.address || 'No address'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 text-muted-foreground">
                          {supplier.contact_person && <span className="flex items-center gap-1"><UserIcon className="h-3 w-3"/> {supplier.contact_person}</span>}
                          {supplier.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3"/> {supplier.email}</span>}
                          {supplier.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3"/> {supplier.phone}</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          {supplier.bbbee_level ? (
                            <Badge variant="outline" className="w-fit bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                              Level {supplier.bbbee_level}
                            </Badge>
                          ) : <span className="text-xs text-muted-foreground">No B-BBEE</span>}
                          {supplier.tax_number && <span className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><FileText className="h-3 w-3"/> {supplier.tax_number}</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={supplier.is_active ? "default" : "secondary"} className={supplier.is_active ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-0" : ""}>
                          {supplier.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="glass-strong border-border/50">
                            <DropdownMenuItem className="cursor-pointer" onClick={() => { setEditingSupplier(supplier); setIsModalOpen(true); }}>
                              <Pencil className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive" onClick={() => deleteMutation.mutate(supplier.id)}>
                              <Trash className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      <SupplierModal open={isModalOpen} onOpenChange={setIsModalOpen} initialData={editingSupplier} />
    </div>
    </Layout>
  );
}

function UserIcon(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
}

function SupplierModal({ open, onOpenChange, initialData }: { open: boolean, onOpenChange: (open: boolean) => void, initialData: Supplier | null }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Partial<Supplier>>({ name: '', is_active: true });
  
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({ name: '', is_active: true });
    }
  }, [initialData, open]);
  
  const mutationFn = initialData 
    ? (data: Partial<Supplier>) => supplierApi.updateSupplier(initialData.id, data as Supplier)
    : supplierApi.createSupplier;

  const saveMutation = useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast({ title: "Success", description: `Supplier ${initialData ? 'updated' : 'created'}.` });
      onOpenChange(false);
    },
    onError: () => toast({ title: "Error", description: `Could not ${initialData ? 'update' : 'create'} supplier.`, variant: "destructive" })
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong border-border/50 sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Supplier' : 'Add New Supplier'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Company Name *</Label>
            <Input id="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="bg-background/50" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="contact">Contact Person</Label>
              <Input id="contact" value={formData.contact_person || ''} onChange={e => setFormData({...formData, contact_person: e.target.value})} className="bg-background/50" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} className="bg-background/50" />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} className="bg-background/50" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="bbbee">B-BBEE Level</Label>
              <Input id="bbbee" placeholder="e.g. 1" value={formData.bbbee_level || ''} onChange={e => setFormData({...formData, bbbee_level: e.target.value})} className="bg-background/50" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tax">Tax Number</Label>
              <Input id="tax" value={formData.tax_number || ''} onChange={e => setFormData({...formData, tax_number: e.target.value})} className="bg-background/50" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button 
            className="bg-indigo-600 hover:bg-indigo-700 text-white" 
            disabled={!formData.name || saveMutation.isPending}
            onClick={() => saveMutation.mutate(formData)}
          >
            {saveMutation.isPending ? 'Saving...' : 'Save Supplier'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
