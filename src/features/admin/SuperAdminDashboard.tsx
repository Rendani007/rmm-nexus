import { useEffect, useState } from 'react';
import { User, Building2, TrendingUp, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SuperAdminLayout } from './SuperAdminLayout';
import { getAdminStats, AdminStats } from '@/api/admin';
import { Skeleton } from '@/components/ui/skeleton';

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

    return (
        <SuperAdminLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
                    <p className="text-muted-foreground">
                        System-wide statistics and activity
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <Skeleton className="h-7 w-20" />
                            ) : (
                                <>
                                    <div className="text-2xl font-bold">{stats?.total_tenants}</div>
                                    <p className="text-xs text-muted-foreground">
                                        Registered businesses
                                    </p>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Tenants</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <Skeleton className="h-7 w-20" />
                            ) : (
                                <>
                                    <div className="text-2xl font-bold">{stats?.active_tenants}</div>
                                    <p className="text-xs text-muted-foreground">
                                        Currently active
                                    </p>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                            <User className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <Skeleton className="h-7 w-20" />
                            ) : (
                                <>
                                    <div className="text-2xl font-bold">{stats?.total_users}</div>
                                    <p className="text-xs text-muted-foreground">
                                        Across all tenants
                                    </p>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">System Health</CardTitle>
                            <AlertCircle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">Healthy</div>
                            <p className="text-xs text-muted-foreground">All systems operational</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </SuperAdminLayout>
    );
};
