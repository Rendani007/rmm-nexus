import { useEffect, useState } from 'react';
import { User, Building2, TrendingUp, DollarSign, CreditCard, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SuperAdminLayout } from './SuperAdminLayout';
import { getAdminStats, AdminStats } from '@/api/admin';
import { Skeleton } from '@/components/ui/skeleton';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export const SuperAdminDashboard = () => {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await getAdminStats();
                setStats(data);
            } catch (error) {
                console.error('Failed to load admin stats', error);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    // Helper for formatting currency
    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(val);
    };

    return (
        <SuperAdminLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">SaaS Management Hub</h1>
                    <p className="text-muted-foreground">
                        Financial performance and system-wide statistics
                    </p>
                </div>

                {/* Financial KPI Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {import.meta.env.VITE_ENABLE_BILLING === 'true' && (
                        <>
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

                    </>
                    )}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">System Health</CardTitle>
                            <Activity className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            {loading ? <Skeleton className="h-7 w-20" /> : (
                                <>
                                    <div className="text-2xl font-bold text-emerald-600">Healthy</div>
                                    <p className="text-xs text-muted-foreground">All systems operational</p>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Charts Area */}
                {import.meta.env.VITE_ENABLE_BILLING === 'true' && (
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
                                            <Tooltip formatter={(value: number) => [formatCurrency(value), 'Revenue']} />
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
                                            <Tooltip />
                                            <Legend verticalAlign="bottom" height={36}/>
                                        </PieChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
                )}

                {/* Secondary Stats */}
                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Registered Tenants</CardTitle>
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            {loading ? <Skeleton className="h-7 w-20" /> : (
                                <div className="text-2xl font-bold">{stats?.total_tenants} ({stats?.active_tenants} Active)</div>
                            )}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Platform Users</CardTitle>
                            <User className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            {loading ? <Skeleton className="h-7 w-20" /> : (
                                <div className="text-2xl font-bold">{stats?.total_users}</div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </SuperAdminLayout>
    );
};
