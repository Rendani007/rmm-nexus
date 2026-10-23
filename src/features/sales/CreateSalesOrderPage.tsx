import { useState } from "react";
import { Layout } from "@/components/Layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash, ArrowLeft, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { salesOrderApi, customerApi } from "@/api/sales";
import { listItems } from "@/api/items"; 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Label } from "@/components/ui/label";

export function CreateSalesOrderPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [customerId, setCustomerId] = useState("");
  const [notes, setNotes] = useState("");
  const [isVatInclusive, setIsVatInclusive] = useState(false);
  const [items, setItems] = useState<{ inventory_item_id: string; qty_ordered: number; unit_price: number; _name?: string }[]>([]);

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: customerApi.getCustomers,
  });

  const { data: inventory = [] } = useQuery({
    queryKey: ["items"],
    queryFn: listItems,
  });

  const createMutation = useMutation({
    mutationFn: salesOrderApi.createDraft,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["sales-orders"] });
      toast({ title: "Draft SO Created", description: `SO ${data.reference_number} created successfully.` });
      navigate("/sales/orders");
    },
    onError: () => toast({ title: "Error", description: "Failed to create SO.", variant: "destructive" })
  });

  const addItem = () => {
    setItems([...items, { inventory_item_id: "", qty_ordered: 1, unit_price: 0, _name: "" }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    
    if (field === 'inventory_item_id') {
      const invItem = inventory.find(i => i.id === value);
      if (invItem) {
        newItems[index]._name = invItem.name;
      }
    }
    
    setItems(newItems);
  };

  const totalAmount = items.reduce((sum, item) => sum + (item.qty_ordered * item.unit_price), 0);

  const handleSubmit = () => {
    if (!customerId) return toast({ title: "Validation Error", description: "Please select a customer.", variant: "destructive" });
    if (items.length === 0) return toast({ title: "Validation Error", description: "Please add at least one item.", variant: "destructive" });
    
    const cleanItems = items.map(({ inventory_item_id, qty_ordered, unit_price }) => ({
      inventory_item_id, qty_ordered: Number(qty_ordered), unit_price: Number(unit_price)
    }));

    createMutation.mutate({
      customer_id: customerId,
      notes,
      items: cleanItems
    });
  };

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6 max-w-5xl mx-auto pb-12 w-full max-w-full min-w-0">
      <div className="flex items-center gap-3 min-w-0">
        <Button variant="ghost" size="icon" className="shrink-0 h-9 w-9" onClick={() => navigate('/sales/orders')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Create Sales Order</h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-0.5 break-words">Draft a new Sales Order for a customer.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="glass-panel border-border/50">
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
              <CardDescription>Select the items and quantities you are selling.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-end bg-background/50 p-3.5 sm:p-4 rounded-xl border border-border/50 shadow-sm relative">
                  <div className="flex-1 w-full space-y-1.5 sm:space-y-2">
                    <div className="flex items-center justify-between sm:hidden">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Item #{index + 1}</span>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10" onClick={() => removeItem(index)}>
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                    <Label className="text-xs sm:text-sm">Inventory Item</Label>
                    <select 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={item.inventory_item_id}
                      onChange={(e) => updateItem(index, 'inventory_item_id', e.target.value)}
                    >
                      <option value="">Select an item...</option>
                      {inventory.map(inv => (
                        <option key={inv.id} value={inv.id}>{inv.name} (Stock: {inv.total_quantity})</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3 w-full sm:contents">
                    <div className="space-y-1.5 sm:space-y-2 sm:w-24">
                      <Label className="text-xs sm:text-sm">Qty</Label>
                      <Input 
                        type="number" 
                        min="1" 
                        value={item.qty_ordered} 
                        onChange={(e) => updateItem(index, 'qty_ordered', e.target.value)}
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-1.5 sm:space-y-2 sm:w-32">
                      <Label className="text-xs sm:text-sm">Selling Price (R)</Label>
                      <Input 
                        type="number" 
                        min="0" 
                        step="0.01" 
                        value={item.unit_price} 
                        onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                        className="h-10"
                      />
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="hidden sm:inline-flex text-destructive shrink-0 mt-6 min-h-[40px] min-w-[40px]" onClick={() => removeItem(index)}>
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              <Button variant="outline" className="w-full border-dashed min-h-[44px]" onClick={addItem}>
                <Plus className="mr-2 h-4 w-4" /> Add Line Item
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="glass-panel border-border/50">
            <CardHeader>
              <CardTitle>SO Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Customer</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                >
                  <option value="">Select customer...</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>Order Notes</Label>
                <textarea 
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[100px]"
                  placeholder="Additional instructions..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <Switch 
                  id="vat-inclusive" 
                  checked={isVatInclusive}
                  onCheckedChange={setIsVatInclusive}
                />
                <Label htmlFor="vat-inclusive">Prices include VAT</Label>
              </div>

              <div className="pt-4 border-t border-border/50">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">R {(isVatInclusive ? totalAmount / 1.15 : totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-border/50">
                  <span className="text-muted-foreground">VAT (15%)</span>
                  <span className="font-medium">R {(isVatInclusive ? totalAmount - (totalAmount / 1.15) : totalAmount * 0.15).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center mb-6">
                  <span className="font-medium text-lg">Total Estimate</span>
                  <span className="text-2xl font-bold">R {(isVatInclusive ? totalAmount : totalAmount * 1.15).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                
                <Button 
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white min-h-[44px]" 
                  onClick={handleSubmit}
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Draft SO
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </Layout>
  );
}
