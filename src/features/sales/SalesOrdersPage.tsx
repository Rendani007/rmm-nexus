import { useState } from "react";
import { Layout } from "@/components/Layout";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, ShoppingCart, ChevronRight } from "lucide-react";
import { salesOrderApi } from "@/api/sales";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

export function SalesOrdersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  
  const { data: sos = [], isLoading } = useQuery({
    queryKey: ["sales-orders"],
    queryFn: salesOrderApi.getSalesOrders,
  });

  const filteredSOs = sos.filter(so => 
    so.reference_number.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (so.customer?.name && so.customer.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft': return <Badge variant="secondary" className="bg-slate-500/10 text-slate-500">Draft</Badge>;
      case 'confirmed': return <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-0">Confirmed (Awaiting Pick)</Badge>;
      case 'partially_dispatched': return <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-0">Partially Dispatched</Badge>;
      case 'fulfilled': return <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-0">Fulfilled</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6 w-full max-w-full min-w-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 w-full min-w-0">
        <div className="min-w-0 w-full">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Sales Orders</h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1 break-words">Manage outbound sales and dispatch workflows.</p>
        </div>
        <Button onClick={() => navigate('/sales/orders/new')} className="bg-indigo-600 hover:bg-indigo-700 text-white w-full sm:w-auto min-h-[44px] shrink-0">
          <Plus className="mr-2 h-4 w-4" /> Create Sales Order
        </Button>
      </div>

      <Card className="glass-panel border-border/50">
        <CardHeader className="border-b border-border/50 pb-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by SO number or customer..."
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
              <div className="p-8 text-center text-sm text-muted-foreground">Loading sales orders...</div>
            ) : filteredSOs.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">No sales orders found.</div>
            ) : (
              filteredSOs.map((so) => (
                <div 
                  key={so.id} 
                  onClick={() => navigate(`/sales/orders/${so.id}`)}
                  className="p-4 active:bg-muted/30 transition-colors flex flex-col gap-2 cursor-pointer min-h-[64px]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-sm flex items-center gap-1.5 text-foreground">
                      <ShoppingCart className="h-4 w-4 text-indigo-500 shrink-0" />
                      {so.reference_number}
                    </span>
                    {getStatusBadge(so.status)}
                  </div>
                  <div className="text-sm font-medium text-muted-foreground truncate">
                    {so.customer?.name || 'Unknown Customer'}
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-border/30 text-xs">
                    <span className="text-muted-foreground">
                      {so.created_at ? format(new Date(so.created_at), 'MMM dd, yyyy') : '-'}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-foreground text-sm">
                        R {Number(so.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                  <th className="px-6 py-4 font-medium">Customer</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium text-right">Total Amount</th>
                  <th className="px-6 py-4 font-medium text-center">Status</th>
                  <th className="px-6 py-4 font-medium text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">Loading sales orders...</td>
                  </tr>
                ) : filteredSOs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">No sales orders found.</td>
                  </tr>
                ) : (
                  filteredSOs.map((so) => (
                    <tr 
                      key={so.id} 
                      className="hover:bg-muted/10 transition-colors cursor-pointer"
                      onClick={() => navigate(`/sales/orders/${so.id}`)}
                    >
                      <td className="px-6 py-4 font-medium text-foreground flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                        {so.reference_number}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {so.customer?.name || 'Unknown Customer'}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {so.created_at ? format(new Date(so.created_at), 'MMM dd, yyyy') : '-'}
                      </td>
                      <td className="px-6 py-4 text-right font-medium">
                        R {Number(so.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {getStatusBadge(so.status)}
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
