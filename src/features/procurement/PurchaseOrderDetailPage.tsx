import { useState } from "react";
import { Layout } from "@/components/Layout";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle, PackageCheck, Loader2 } from "lucide-react";
import { purchaseOrderApi } from "@/api/purchaseOrders";
import { listLocations } from "@/api/locations"; 
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export function PurchaseOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isReceivingModalOpen, setIsReceivingModalOpen] = useState(false);
  const [receivingState, setReceivingState] = useState<{ po_item_id: string; qty_received: number }[]>([]);
  const [receivingLocation, setReceivingLocation] = useState("");

  const { data: po, isLoading } = useQuery({
    queryKey: ["purchase-orders", id],
    queryFn: () => purchaseOrderApi.getPurchaseOrder(id!),
    enabled: !!id,
  });

  const { data: locations = [] } = useQuery({
    queryKey: ["locations"],
    queryFn: listLocations,
  });

  const approveMutation = useMutation({
    mutationFn: () => purchaseOrderApi.approveOrder(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders", id] });
      toast({ title: "PO Approved", description: "The purchase order has been approved and sent." });
    },
    onError: () => toast({ title: "Error", description: "Failed to approve PO.", variant: "destructive" })
  });

  const submitMutation = useMutation({
    mutationFn: () => purchaseOrderApi.submitOrder(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders", id] });
      toast({ title: "PO Submitted", description: "The purchase order was submitted for approval." });
    },
    onError: () => toast({ title: "Error", description: "Failed to submit PO.", variant: "destructive" })
  });

  const receiveMutation = useMutation({
    mutationFn: (payload: any) => purchaseOrderApi.receiveItems(id!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders", id] });
      toast({ title: "Items Received", description: "Stock levels have been successfully updated." });
      setIsReceivingModalOpen(false);
    },
    onError: (err: any) => toast({ title: "Error", description: err.response?.data?.message || "Failed to receive items.", variant: "destructive" })
  });

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'draft': return <Badge variant="secondary" className="bg-slate-500/10 text-slate-500">Draft</Badge>;
      case 'sent': return <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-0">Awaiting Delivery</Badge>;
      case 'partially_received': return <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-0">Partially Received</Badge>;
      case 'fulfilled': return <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-0">Fulfilled</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleOpenReceiveModal = () => {
    if (!po) return;
    // initialize receiving state for items that haven't been fully received yet
    const pendingItems = po.items?.filter(item => item.qty_received < item.qty_ordered) || [];
    setReceivingState(pendingItems.map(i => ({ po_item_id: i.id, qty_received: i.qty_ordered - i.qty_received })));
    setIsReceivingModalOpen(true);
  };

  const handleReceiveQtyChange = (poItemId: string, val: string) => {
    setReceivingState(prev => prev.map(p => p.po_item_id === poItemId ? { ...p, qty_received: Number(val) } : p));
  };

  const handleReceiveSubmit = () => {
    if (!receivingLocation) return toast({ title: "Validation Error", description: "Please select a warehouse location to receive the goods into.", variant: "destructive" });
    
    // Only send items where qty_received > 0
    const itemsToReceive = receivingState.filter(r => r.qty_received > 0);
    if (itemsToReceive.length === 0) return toast({ title: "Validation Error", description: "Please specify at least one item quantity to receive.", variant: "destructive" });

    receiveMutation.mutate({
      to_location_id: receivingLocation,
      items: itemsToReceive
    });
  };

  if (isLoading || !po) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6 max-w-5xl mx-auto pb-12 w-full max-w-full min-w-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 w-full min-w-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <Button variant="ghost" size="icon" onClick={() => navigate('/procurement/purchase-orders')} className="min-h-[44px] min-w-[44px] shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight truncate">{po.reference_number}</h1>
              {getStatusBadge(po.status)}
            </div>
            <p className="text-muted-foreground text-xs sm:text-sm truncate">Order to {po.supplier?.name}</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {po.status === 'draft' && (
             <Button variant="outline" className="border-indigo-600 text-indigo-600 hover:bg-indigo-600/10 flex-1 sm:flex-initial min-h-[44px]" onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending}>
               Submit for Approval
             </Button>
          )}
          {po.status === 'draft' && (
             <Button className="bg-indigo-600 hover:bg-indigo-700 text-white flex-1 sm:flex-initial min-h-[44px]" onClick={() => approveMutation.mutate()} disabled={approveMutation.isPending}>
               <CheckCircle className="mr-2 h-4 w-4" /> Approve Order
             </Button>
          )}
          {(po.status === 'sent' || po.status === 'partially_received') && (
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto min-h-[44px]" onClick={handleOpenReceiveModal}>
              <PackageCheck className="mr-2 h-4 w-4" /> Receive Goods
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="glass-panel border-border/50">
            <CardHeader className="border-b border-border/50 pb-3">
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {/* Mobile Line Items View */}
              <div className="block md:hidden divide-y divide-border/50">
                {po.items?.map((item) => (
                  <div key={item.id} className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-sm text-foreground">{item.inventory_item?.name || 'Unknown'}</p>
                        <p className="font-mono text-xs text-muted-foreground">SKU: {item.inventory_item?.sku || 'None'}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${item.qty_received === item.qty_ordered ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"}`}>
                        {item.qty_received} / {item.qty_ordered} Recv
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-border/30 text-xs">
                      <span className="text-muted-foreground">
                        {item.qty_ordered} × R {Number(item.unit_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <span className="font-bold text-foreground text-sm">
                        R {Number(item.total_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Mobile Financial Summary */}
                <div className="p-4 bg-muted/20 space-y-2 text-sm">
                  <div className="flex justify-between text-muted-foreground text-xs">
                    <span>Subtotal</span>
                    <span>R {(po.is_vat_inclusive ? Number(po.total_amount) / 1.15 : Number(po.total_amount)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground text-xs">
                    <span>VAT (15%)</span>
                    <span>R {(po.is_vat_inclusive ? Number(po.total_amount) - (Number(po.total_amount) / 1.15) : Number(po.total_amount) * 0.15).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-border/50 font-bold text-base text-foreground">
                    <span>Total Amount</span>
                    <span className="text-indigo-600 dark:text-indigo-400">R {(po.is_vat_inclusive ? Number(po.total_amount) : Number(po.total_amount) * 1.15).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-muted/30 text-muted-foreground border-b border-border/50">
                    <tr>
                      <th className="px-6 py-4 font-medium">Item</th>
                      <th className="px-6 py-4 font-medium text-center">Ordered</th>
                      <th className="px-6 py-4 font-medium text-center">Received</th>
                      <th className="px-6 py-4 font-medium text-right">Unit Price</th>
                      <th className="px-6 py-4 font-medium text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {po.items?.map((item) => (
                      <tr key={item.id} className="hover:bg-muted/10 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-medium">{item.inventory_item?.name || 'Unknown'}</p>
                          <p className="text-xs text-muted-foreground">SKU: {item.inventory_item?.sku}</p>
                        </td>
                        <td className="px-6 py-4 text-center font-medium">{item.qty_ordered}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={item.qty_received === item.qty_ordered ? "text-emerald-500 font-bold" : "text-amber-500 font-bold"}>
                            {item.qty_received}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">R {Number(item.unit_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="px-6 py-4 text-right font-medium">R {Number(item.total_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                    <tr className="bg-muted/10">
                      <td colSpan={4} className="px-6 py-4 text-right font-medium text-muted-foreground">Subtotal:</td>
                      <td className="px-6 py-4 text-right font-medium text-muted-foreground">R {(po.is_vat_inclusive ? Number(po.total_amount) / 1.15 : Number(po.total_amount)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                    <tr className="bg-muted/10">
                      <td colSpan={4} className="px-6 py-4 text-right font-medium text-muted-foreground">VAT (15%):</td>
                      <td className="px-6 py-4 text-right font-medium text-muted-foreground">R {(po.is_vat_inclusive ? Number(po.total_amount) - (Number(po.total_amount) / 1.15) : Number(po.total_amount) * 0.15).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                    <tr className="bg-muted/30">
                      <td colSpan={4} className="px-6 py-4 text-right font-bold text-lg">Total Amount:</td>
                      <td className="px-6 py-4 text-right font-bold text-lg">R {(po.is_vat_inclusive ? Number(po.total_amount) : Number(po.total_amount) * 1.15).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="glass-panel border-border/50">
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Supplier</p>
                <p className="font-medium">{po.supplier?.name}</p>
              </div>
              {po.expected_delivery_date && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Expected Delivery</p>
                  <p className="font-medium">{po.expected_delivery_date}</p>
                </div>
              )}
              {po.notes && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Notes</p>
                  <p className="text-sm bg-muted/30 p-3 rounded-md">{po.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="glass-panel border-border/50">
            <CardHeader>
              <CardTitle>Audit Trail</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Created By</p>
                  <p className="font-medium text-sm">{po.creator?.first_name} {po.creator?.last_name}</p>
               </div>
               {po.approver && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Approved By</p>
                  <p className="font-medium text-sm">{po.approver?.first_name} {po.approver?.last_name}</p>
                </div>
               )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isReceivingModalOpen} onOpenChange={setIsReceivingModalOpen}>
        <DialogContent className="glass-strong border-border/50 sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Receive Goods</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2 mb-4">
              <Label>Receive Into Location *</Label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={receivingLocation}
                onChange={(e) => setReceivingLocation(e.target.value)}
              >
                <option value="">Select warehouse location...</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-4">
              <Label>Quantities Received on Dock</Label>
              {po.items?.filter(item => item.qty_received < item.qty_ordered).map(item => {
                const stateVal = receivingState.find(r => r.po_item_id === item.id)?.qty_received ?? 0;
                return (
                  <div key={item.id} className="flex items-center justify-between bg-muted/20 p-3 rounded-md border border-border/50">
                    <div>
                      <p className="font-medium text-sm">{item.inventoryItem?.name}</p>
                      <p className="text-xs text-muted-foreground">Ordered: {item.qty_ordered} | Previously Received: {item.qty_received}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground">Qty Now:</Label>
                      <Input 
                        type="number" 
                        className="w-20 text-center" 
                        min="0" 
                        max={item.qty_ordered - item.qty_received}
                        value={stateVal}
                        onChange={(e) => handleReceiveQtyChange(item.id, e.target.value)}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReceivingModalOpen(false)}>Cancel</Button>
            <Button 
              className="bg-emerald-600 hover:bg-emerald-700 text-white" 
              onClick={handleReceiveSubmit}
              disabled={receiveMutation.isPending}
            >
              {receiveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </Layout>
  );
}
