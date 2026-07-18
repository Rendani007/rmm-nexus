import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, PackageSearch, Building2, Package } from 'lucide-react';
import axios from 'axios';

interface PublicItem {
  tenant: {
    name: string;
    industry: string;
  };
  item: {
    id: string;
    name: string;
    sku: string;
    category: string;
    uom: string;
    metadata: Record<string, any>;
    created_at: string;
  };
}

export const PublicItemPage = () => {
  const { tenant_id, item_id } = useParams<{ tenant_id: string; item_id: string }>();
  const [data, setData] = useState<PublicItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/v1/public/${tenant_id}/items/${item_id}`);
        setData(response.data);
      } catch (err: any) {
        setError(err?.response?.data?.error || 'Item not found or unavailable.');
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [tenant_id, item_id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-slate-200 rounded-full mb-4"></div>
          <div className="h-4 w-32 bg-slate-200 rounded mb-2"></div>
          <div className="h-3 w-24 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-red-100">
          <CardContent className="pt-6 text-center">
            <PackageSearch className="mx-auto h-12 w-12 text-slate-300 mb-4" />
            <h2 className="text-xl font-semibold text-slate-800 mb-2">Item Unavailable</h2>
            <p className="text-slate-500 text-sm">{error || 'This item could not be found.'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { tenant, item } = data;

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6">
      <div className="max-w-xl mx-auto space-y-6">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center justify-center text-center space-y-2 mb-8">
          <div className="h-16 w-16 bg-white rounded-2xl shadow-sm border flex items-center justify-center mb-2">
            <Building2 className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{tenant.name}</h1>
          {tenant.industry && (
            <Badge variant="secondary" className="text-xs font-medium bg-blue-50 text-blue-700">
              {tenant.industry}
            </Badge>
          )}
        </div>

        {/* Product Card */}
        <Card className="overflow-hidden border-slate-200/60 shadow-lg shadow-slate-200/40">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8 text-white text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Package className="h-32 w-32" />
            </div>
            
            <ShieldCheck className="h-10 w-10 text-emerald-400 mx-auto mb-3" />
            <h2 className="text-3xl font-bold mb-1 relative z-10">{item.name}</h2>
            <p className="text-blue-100 font-mono text-sm relative z-10">SKU: {item.sku}</p>
          </div>
          
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <p className="text-xs text-slate-500 font-medium mb-1">Category</p>
                <p className="text-sm font-semibold text-slate-900">{item.category || '-'}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <p className="text-xs text-slate-500 font-medium mb-1">Unit of Measure</p>
                <p className="text-sm font-semibold text-slate-900">{item.uom}</p>
              </div>
            </div>

            {/* Custom Public Fields */}
            {item.metadata && Object.keys(item.metadata).length > 0 && (
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center">
                  Product Details
                </h3>
                <div className="space-y-3">
                  {Object.entries(item.metadata).map(([key, value]) => {
                    if (!value) return null;
                    return (
                      <div key={key} className="flex flex-col">
                        <span className="text-xs text-slate-500 capitalize">{key.replace(/_/g, ' ')}</span>
                        <span className="text-sm text-slate-800">{String(value)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <p className="text-center text-xs text-slate-400 pt-8">
          Powered by Resource Modular Management
        </p>
      </div>
    </div>
  );
};
