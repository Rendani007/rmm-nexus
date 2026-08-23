import { useEffect, useState } from 'react';
import { User, Building2, TrendingUp, DollarSign, CreditCard, Activity, Package, Layers, Calendar, Target, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SuperAdminLayout } from './SuperAdminLayout';
import { getAdminStats, AdminStats } from '@/api/admin';
import { Skeleton } from '@/components/ui/skeleton';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export const SuperAdminDashboard = () => {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<string>('all_time');
    const [marketingSpend, setMarketingSpend] = useState<string>('5000');

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const data = await getAdminStats(period);
                setStats(data);
            } catch (error) {
                console.error('Failed to load admin stats', error);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [period]);

    // Helper for formatting currency
    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(val);
    };

    const cac = Number(marketingSpend) > 0 && stats?.active_tenants 
        ? Number(marketingSpend) / stats.active_tenants 
        : 0;

    return (
        <SuperAdminLayout>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">SaaS Management Hub</h1>
                        <p className="text-muted-foreground">
                            Financial performance, valuation, and system-wide statistics
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="outline" size="sm" className="h-10">
                                    <Target className="h-4 w-4 mr-2" /> CAC Settings
                                </Button>
                            </SheetTrigger>
                            <SheetContent>
                                <SheetHeader>
                                    <SheetTitle>Marketing & Acquisition Settings</SheetTitle>
                                    <SheetDescription>
                                        Configure your inputs to calculate dynamic Customer Acquisition Cost (CAC).
                                    </SheetDescription>
                                </SheetHeader>
                                <div className="space-y-4 mt-6">
                                    <div className="space-y-2">
                                        <Label>Estimated Marketing Spend (ZAR)</Label>
                                        <Input 
                                            type="number" 
                                            value={marketingSpend} 
                                            onChange={(e) => setMarketingSpend(e.target.value)}
                                            placeholder="5000"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            This value is divided by the active tenants to estimate CAC.
                                        </p>
                                    </div>
                                </div>
                            </SheetContent>
                        </Sheet>
                        <Select value={period} onValueChange={setPeriod}>
                            <SelectTrigger className="w-[180px] bg-white h-10">
                                <div className="flex items-center">
                                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                                    <SelectValue placeholder="Select Period" />
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all_time">All Time</SelectItem>
                                <SelectItem value="yearly">This Year</SelectItem>
                                <SelectItem value="quarterly">This Quarter</SelectItem>
                                <SelectItem value="monthly">This Month</SelectItem>
                                <SelectItem value="daily">Today</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* SaaS Valuation Metrics */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="bg-gradient-to-br from-indigo-50 to-white border-indigo-100 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-indigo-900">LTV (Lifetime Value)</CardTitle>
                            <TrendingUp className="h-4 w-4 text-indigo-500" />
                        </CardHeader>
                        <CardContent>
                            {loading ? <Skeleton className="h-7 w-20" /> : (
                                <>
                                    <div className="text-2xl font-bold text-indigo-700">{formatCurrency(stats?.ltv || 0)}</div>
                                    <p className="text-xs text-indigo-500 font-medium mt-1">Expected revenue per customer</p>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-rose-50 to-white border-rose-100 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-rose-900">Churn Rate</CardTitle>
                            <RefreshCw className="h-4 w-4 text-rose-500" />
                        </CardHeader>
                        <CardContent>
                            {loading ? <Skeleton className="h-7 w-20" /> : (
                                <>
                                    <div className="text-2xl font-bold text-rose-700">{stats?.churn_rate || 0}%</div>
                                    <p className="text-xs text-rose-500 font-medium mt-1">Cancellation rate</p>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-100 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-emerald-900">ARPU</CardTitle>
                            <DollarSign className="h-4 w-4 text-emerald-500" />
                        </CardHeader>
                        <CardContent>
                            {loading ? <Skeleton className="h-7 w-20" /> : (
                                <>
                                    <div className="text-2xl font-bold text-emerald-700">{formatCurrency(stats?.arpu || 0)}</div>
                                    <p className="text-xs text-emerald-500 font-medium mt-1">Average Revenue Per User</p>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-100 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-amber-900">Est. CAC</CardTitle>
                            <Target className="h-4 w-4 text-amber-500" />
                        </CardHeader>
                        <CardContent>
                            {loading ? <Skeleton className="h-7 w-20" /> : (
                                <>
                                    <div className="text-2xl font-bold text-amber-700">{formatCurrency(cac)}</div>
                                    <p className="text-xs text-amber-500 font-medium mt-1">Customer Acquisition Cost</p>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Platform Scale & Volume Metrics */}
                <div>
                    <h2 className="text-xl font-semibold tracking-tight mb-4 text-slate-800">Platform Scale & Volume</h2>
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Global Inventory Items</CardTitle>
                                <Package className="h-4 w-4 text-slate-500" />
                            </CardHeader>
                            <CardContent>
                                {loading ? <Skeleton className="h-7 w-20" /> : (
                                    <>
                                        <div className="text-2xl font-bold">{stats?.total_global_items?.toLocaleString() || 0}</div>
                                        <p className="text-xs text-muted-foreground mt-1">Items managed across all tenants</p>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Global Stock Movements</CardTitle>
                                <Layers className="h-4 w-4 text-slate-500" />
                            </CardHeader>
                            <CardContent>
                                {loading ? <Skeleton className="h-7 w-20" /> : (
                                    <>
                                        <div className="text-2xl font-bold">{stats?.total_global_movements?.toLocaleString() || 0}</div>
                                        <p className="text-xs text-muted-foreground mt-1">Transactions processed</p>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Active Platform Users</CardTitle>
                                <User className="h-4 w-4 text-slate-500" />
                            </CardHeader>
                            <CardContent>
                                {loading ? <Skeleton className="h-7 w-20" /> : (
                                    <>
                                        <div className="text-2xl font-bold">{stats?.total_global_users?.toLocaleString() || 0}</div>
                                        <p className="text-xs text-muted-foreground mt-1">Total engaged users globally</p>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Financial KPI Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Monthly Recurring Revenue</CardTitle>
                            <DollarSign className="h-4 w-4 text-emerald-500" />
                        </CardHeader>
                        <CardContent>
                            {loading ? <Skeleton className="h-7 w-20" /> : (
                                <>
                                    <div className="text-2xl font-bold">{formatCurrency(stats?.mrr || 0)}</div>
                                    <p className="text-xs text-muted-foreground">MRR from active subscriptions</p>
                                    {period !== 'all_time' && (
                                        <div className="text-xs text-emerald-600 font-medium mt-1">
                                            + {formatCurrency(stats?.new_mrr || 0)} new MRR this period
                                        </div>
                                    )}
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Annual Recurring Revenue</CardTitle>
                            <TrendingUp className="h-4 w-4 text-emerald-500" />
                        </CardHeader>
                        <CardContent>
                            {loading ? <Skeleton className="h-7 w-20" /> : (
                                <>
                                    <div className="text-2xl font-bold">{formatCurrency(stats?.arr || 0)}</div>
                                    <p className="text-xs text-muted-foreground">Projected 12-month run rate</p>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
                            <CreditCard className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            {loading ? <Skeleton className="h-7 w-20" /> : (
                                <>
                                    <div className="text-2xl font-bold">{stats?.active_subscriptions || 0}</div>
                                    <p className="text-xs text-muted-foreground">Paying tenant organizations</p>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Charts Area */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                    {/* Revenue Line Chart */}
                    <Card className="col-span-4">
                        <CardHeader>
                            <CardTitle>Revenue Forecast (12 Months)</CardTitle>
                            <CardDescription>Trailing growth simulation</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px]">
                                {loading ? <Skeleton className="h-full w-full" /> : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={stats?.revenue_chart || []}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="month" />
                                            <YAxis tickFormatter={(val) => `R${val / 1000}k`} />
                                            <RechartsTooltip formatter={(value: number) => [formatCurrency(value), 'Revenue']} />
                                            <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Subscription Distribution */}
                    <Card className="col-span-3">
                        <CardHeader>
                            <CardTitle>Plan Distribution</CardTitle>
                            <CardDescription>Adoption by active subscribers</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px]">
                                {loading ? <Skeleton className="h-full w-full" /> : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={stats?.plan_distribution || []}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={90}
                                                fill="#8884d8"
                                                paddingAngle={5}
                                                dataKey="count"
                                                nameKey="plan_name"
                                            >
                                                {(stats?.plan_distribution || []).map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip />
                                            <Legend verticalAlign="bottom" height={36}/>
                                        </PieChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </SuperAdminLayout>
    );
};

