import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, MapPin, Plus, TrendingUp, AlertCircle, ArrowDown, ArrowUp, ArrowLeftRight, Building2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/Layout';
import { listItems } from '@/api/items';
import { listLocations } from '@/api/locations';
import { listStockMovements } from '@/api/stock';
import { getDepartments } from '@/api/departments';
import { format } from 'date-fns';
import { api } from '@/api/axios';
import type { InventoryLocation } from '@/types';
import { useAuthStore } from '@/features/auth/useAuthStore';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function normalizeLocations(payload: unknown): InventoryLocation[] {
  if (Array.isArray(payload)) return payload as InventoryLocation[];
  const o = (payload ?? null) as Record<string, unknown> | null;
  if (!o) return [];
  if (Array.isArray(o.items)) return o.items as InventoryLocation[];
  if (Array.isArray(o.data)) return o.data as InventoryLocation[];
  return [];
}

export const Dashboard = () => {
  const navigate = useNavigate();
  const [itemCount, setItemCount] = useState<number>(0);
  const [locations, setLocations] = useState<InventoryLocation[]>([]);
  const [lowStockCount, setLowStockCount] = useState<number>(0);
  const [recentMovements, setRecentMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Department Filtering
  const [departments, setDepartments] = useState<any[]>([]);
  const { user } = useAuthStore();
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>(
    user?.department_id ? user.department_id : 'all'
  );

  useEffect(() => {
    if (user && !user.is_tenant_admin && user.department_id) {
      setSelectedDepartmentId(user.department_id);
    }
  }, [user]);

  useEffect(() => {
    // Load departments once
    if (user?.is_tenant_admin) {
      getDepartments({ per_page: 100 }).then((res) => {
        setDepartments(res.data?.data || []);
      }).catch(console.error);
    }
  }, [user]);

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      try {
        const params: any = {};
        if (selectedDepartmentId && selectedDepartmentId !== 'all') {
          params.department_id = selectedDepartmentId;
        }

        const [itemsRes, locationsRes, movementsRes, statsRes] = await Promise.allSettled([
          listItems(params),
          listLocations(params),
          listStockMovements({ page: 1, ...params }),
          api.get('/inventory/items/dashboard-stats', { params })
        ]);

        if (itemsRes.status === 'fulfilled') {
          setItemCount(itemsRes.value.length);
        }

        if (locationsRes.status === 'fulfilled') {
          const locs = normalizeLocations(locationsRes.value);
          setLocations(locs);
        }

        if (movementsRes.status === 'fulfilled') {
          setRecentMovements(movementsRes.value.data.slice(0, 5));
        }

        if (statsRes.status === 'fulfilled') {
          setLowStockCount(statsRes.value.data.data.low_stock_count);
        } else {
          console.error('Failed to load dashboard stats:', statsRes.reason);
        }

      } catch (error) {
        console.error('Unexpected error loading stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [selectedDepartmentId]);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Manage your inventory, locations, and stock movements
            </p>
          </div>

          {user?.is_tenant_admin && (
            <div className="w-[200px]">
              <Select value={selectedDepartmentId} onValueChange={setSelectedDepartmentId}>
                <SelectTrigger>
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center">
                      <Building2 className="mr-2 h-4 w-4 opacity-50" />
                      All Departments
                    </div>
                  </SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-7 w-16 animate-pulse rounded bg-muted" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{itemCount}</div>
                  <p className="text-xs text-muted-foreground">
                    Active inventory items
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Locations</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-7 w-16 animate-pulse rounded bg-muted" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{locations.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Storage locations
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stock Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">Coming soon</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
              <AlertCircle className={`h-4 w-4 ${lowStockCount > 0 ? 'text-red-500' : 'text-muted-foreground'}`} />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-7 w-16 animate-pulse rounded bg-muted" />
              ) : (
                <>
                  <div className={`text-2xl font-bold ${lowStockCount > 0 ? 'text-red-600' : ''}`}>
                    {lowStockCount}
                  </div>
                  <p className="text-xs text-muted-foreground">Items below reorder level</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks to manage your inventory
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button onClick={() => navigate('/items')}>
                <Plus className="mr-2 h-4 w-4" />
                New Item
              </Button>
              <Button onClick={() => navigate('/locations')} variant="secondary">
                <Plus className="mr-2 h-4 w-4" />
                New Location
              </Button>
              <Button onClick={() => navigate('/stock')} variant="outline">
                Manual Adjustment
              </Button>
              <Button onClick={() => navigate('/stock/request')} variant="secondary">
                <ArrowLeftRight className="mr-2 h-4 w-4" />
                Request Transfer
              </Button>
              <Button onClick={() => navigate('/stock/approvals')} variant="outline">
                Approvals Inbox
              </Button>
            </CardContent>
          </Card>

          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Stock by Location</CardTitle>
                <CardDescription>Total items stored</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/locations')}>View All</Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <div key={i} className="h-10 w-full animate-pulse rounded bg-muted" />)}
                </div>
              ) : locations.length === 0 ? (
                <p className="text-sm text-muted-foreground">No locations found.</p>
              ) : (
                <div className="space-y-4">
                  {locations.slice(0, 5).map((loc) => (
                    <div key={loc.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-secondary text-secondary-foreground">
                          <MapPin className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{loc.name}</p>
                          <p className="text-xs text-muted-foreground">{loc.code}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-sm">
                          {loc.total_items ?? 0}
                        </span>
                        <p className="text-xs text-muted-foreground">items</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Stock Movements</CardTitle>
                <CardDescription>Latest inventory changes</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/stock')}>View All</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => <div key={i} className="h-10 w-full animate-pulse rounded bg-muted" />)}
                  </div>
                ) : recentMovements.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No recent movements.</p>
                ) : (
                  recentMovements.map((m: any) => (
                    <div key={m.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${m.type === 'in' ? 'bg-green-100 text-green-700' :
                          m.type === 'out' ? 'bg-red-100 text-red-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                          {m.type === 'in' ? <ArrowDown className="h-4 w-4" /> :
                            m.type === 'out' ? <ArrowUp className="h-4 w-4" /> :
                              <ArrowLeftRight className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{m.item?.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(m.created_at), 'MMM d, HH:mm')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`font-bold text-sm ${m.type === 'out' ? 'text-red-600' : 'text-foreground'
                          }`}>
                          {m.type === 'out' ? '-' : '+'}{m.qty}
                        </span>
                        <p className="text-xs text-muted-foreground">{m.to?.name || m.from?.name}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};
