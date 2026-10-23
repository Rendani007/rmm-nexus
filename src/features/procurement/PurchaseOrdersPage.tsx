import { useState } from "react";
import { Layout } from "@/components/Layout";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, FileText, ChevronRight } from "lucide-react";
import { purchaseOrderApi } from "@/api/purchaseOrders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

export function PurchaseOrdersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  
  const { data: pos = [], isLoading } = useQuery({
    queryKey: ["purchase-orders"],
    queryFn: purchaseOrderApi.getPurchaseOrders,
  });

  const filteredPOs = pos.filter(po => 
    po.reference_number.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (po.supplier?.name && po.supplier.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft': return <Badge variant="secondary" className="bg-slate-500/10 text-slate-500">Draft</Badge>;
      case 'sent': return <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-0">Awaiting Delivery</Badge>;
      case 'partially_received': return <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-0">Partially Received</Badge>;
      case 'fulfilled': return <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-0">Fulfilled</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6 w-full max-w-full min-w-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 w-full min-w-0">
        <div className="min-w-0 w-full">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Purchase Orders</h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1 break-words">Manage your procurement lifecycle from draft to delivery.</p>
        </div>
        <Button onClick={() => navigate('/procurement/purchase-orders/new')} className="bg-indigo-600 hover:bg-indigo-700 text-white w-full sm:w-auto min-h-[44px] shrink-0">
          <Plus className="mr-2 h-4 w-4" /> Create PO
        </Button>
      </div>

      <Card className="glass-panel border-border/50">
        <CardHeader className="border-b border-border/50 pb-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by PO number or supplier..."
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
              <div className="p-8 text-center text-sm text-muted-foreground">Loading purchase orders...</div>
            ) : filteredPOs.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">No purchase orders found.</div>
            ) : (
              filteredPOs.map((po) => (
                <div 
                  key={po.id} 
                  onClick={() => navigate(`/procurement/purchase-orders/${po.id}`)}
                  className="p-4 active:bg-muted/30 transition-colors flex flex-col gap-2 cursor-pointer min-h-[64px]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-sm flex items-center gap-1.5 text-foreground">
                      <FileText className="h-4 w-4 text-indigo-500 shrink-0" />
                      {po.reference_number}
                    </span>
                    {getStatusBadge(po.status)}
                  </div>
                  <div className="text-sm font-medium text-muted-foreground truncate">
                    {po.supplier?.name || 'Unknown Supplier'}
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-border/30 text-xs">
                    <span className="text-muted-foreground">
                      {po.created_at ? format(new Date(po.created_at), 'MMM dd, yyyy') : '-'}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-foreground text-sm">
                        R {Number(po.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
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
                  <th className="px-6 py-4 font-medium">Reference</th>
                  <th className="px-6 py-4 font-medium">Supplier</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium text-right">Total Amount</th>
                  <th className="px-6 py-4 font-medium text-center">Status</th>
                  <th className="px-6 py-4 font-medium text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">Loading purchase orders...</td>
                  </tr>
                ) : filteredPOs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">No purchase orders found.</td>
                  </tr>
                ) : (
                  filteredPOs.map((po) => (
                    <tr 
                      key={po.id} 
                      className="hover:bg-muted/10 transition-colors cursor-pointer"
                      onClick={() => navigate(`/procurement/purchase-orders/${po.id}`)}
                    >
                      <td className="px-6 py-4 font-medium text-foreground flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        {po.reference_number}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {po.supplier?.name || 'Unknown Supplier'}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {po.created_at ? format(new Date(po.created_at), 'MMM dd, yyyy') : '-'}
                      </td>
                      <td className="px-6 py-4 text-right font-medium">
                        R {Number(po.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {getStatusBadge(po.status)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <ChevronRight className="h-4 w-4 text-muted-foreground inline-block" />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
    </Layout>
  );
}
