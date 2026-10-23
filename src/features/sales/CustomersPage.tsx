import { useState } from "react";
import { Layout } from "@/components/Layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Building2, MoreHorizontal } from "lucide-react";
import { customerApi } from "@/api/sales";
import { Customer } from "@/types/sales";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

export function CustomersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    contact_person: "",
    tax_number: "",
    billing_address: "",
  });

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: customerApi.getCustomers,
  });

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const createMutation = useMutation({
    mutationFn: customerApi.createCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast({ title: "Success", description: "Customer created successfully." });
      handleCloseModal();
    },
    onError: () => toast({ title: "Error", description: "Failed to create customer.", variant: "destructive" })
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => customerApi.updateCustomer(editingCustomer!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast({ title: "Success", description: "Customer updated successfully." });
      handleCloseModal();
    },
    onError: () => toast({ title: "Error", description: "Failed to update customer.", variant: "destructive" })
  });

  const deleteMutation = useMutation({
    mutationFn: customerApi.deleteCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast({ title: "Success", description: "Customer deleted successfully." });
    }
  });

  const handleOpenModal = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        name: customer.name,
        email: customer.email || "",
        phone: customer.phone || "",
        contact_person: customer.contact_person || "",
        tax_number: customer.tax_number || "",
        billing_address: customer.billing_address || "",
      });
    } else {
      setEditingCustomer(null);
      setFormData({ name: "", email: "", phone: "", contact_person: "", tax_number: "", billing_address: "" });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCustomer(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCustomer) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6 w-full max-w-full min-w-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 w-full min-w-0">
        <div className="min-w-0 w-full">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1 break-words">Manage your client directory for sales orders.</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="bg-indigo-600 hover:bg-indigo-700 text-white w-full sm:w-auto min-h-[44px] shrink-0">
          <Plus className="mr-2 h-4 w-4" /> Add Customer
        </Button>
      </div>

      <Card className="glass-panel border-border/50">
        <CardHeader className="border-b border-border/50 pb-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search customers..."
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
              <div className="p-8 text-center text-sm text-muted-foreground">Loading customers...</div>
            ) : filteredCustomers.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">No customers found.</div>
            ) : (
              filteredCustomers.map((customer) => (
                <div key={customer.id} className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-indigo-600/10 flex items-center justify-center text-indigo-600 shrink-0">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-base text-foreground leading-snug">{customer.name}</h3>
                        {customer.contact_person && (
                          <p className="text-xs text-muted-foreground">{customer.contact_person}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {customer.is_active ? 
                        <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-0 text-xs">Active</Badge> : 
                        <Badge variant="outline" className="text-xs">Inactive</Badge>}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-9 w-9 p-0 text-muted-foreground">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={() => handleOpenModal(customer)} className="min-h-[40px]">
                            Edit Customer
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive min-h-[40px]"
                            onClick={() => {
                              if (window.confirm("Are you sure you want to delete this customer?")) {
                                deleteMutation.mutate(customer.id);
                              }
                            }}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 text-xs text-muted-foreground pl-10">
                    {customer.email && (
                      <a href={`mailto:${customer.email}`} className="text-indigo-600 dark:text-indigo-400 hover:underline truncate">
                        {customer.email}
                      </a>
                    )}
                    {customer.phone && (
                      <a href={`tel:${customer.phone}`} className="hover:text-foreground">
                        {customer.phone}
                      </a>
                    )}
                    {customer.tax_number && (
                      <span className="font-mono text-muted-foreground">Tax: {customer.tax_number}</span>
                    )}
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
                  <th className="px-6 py-4 font-medium">Customer Name</th>
                  <th className="px-6 py-4 font-medium">Contact</th>
                  <th className="px-6 py-4 font-medium">Tax No</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">Loading customers...</td>
                  </tr>
                ) : filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">No customers found.</td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-muted/10 transition-colors">
                      <td className="px-6 py-4 font-medium text-foreground flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {customer.name}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        <div>{customer.contact_person || '-'}</div>
                        <div className="text-xs">{customer.email}</div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground font-mono text-xs">
                        {customer.tax_number || '-'}
                      </td>
                      <td className="px-6 py-4">
                        {customer.is_active ? 
                          <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-0">Active</Badge> : 
                          <Badge variant="outline">Inactive</Badge>}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenModal(customer)}>Edit</DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => {
                                if (window.confirm("Are you sure you want to delete this customer?")) {
                                  deleteMutation.mutate(customer.id);
                                }
                              }}
                            >
                              Delete
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

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="glass-strong border-border/50 sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Customer Name *</Label>
                <Input id="name" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="contact">Contact Person</Label>
                  <Input id="contact" value={formData.contact_person} onChange={e => setFormData({...formData, contact_person: e.target.value})} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tax">Tax/VAT Number</Label>
                <Input id="tax" value={formData.tax_number} onChange={e => setFormData({...formData, tax_number: e.target.value})} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseModal}>Cancel</Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingCustomer ? 'Save Changes' : 'Create Customer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
    </Layout>
  );
}
