import { useEffect, useState } from 'react';
import { SuperAdminLayout } from './SuperAdminLayout';
import { listTenants, updateTenant, impersonateTenant } from '@/api/admin';
import { useAuthStore } from "@/features/auth/useAuthStore";
import { api } from "@/api/axios";
import { useNavigate } from "react-router-dom";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { MoreHorizontal, Play, Pause, CreditCard } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export const TenantsListPage = () => {
    const [tenants, setTenants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { setAuth } = useAuthStore();
    const navigate = useNavigate();

    const loadTenants = async () => {
        setLoading(true);
        try {
            const response = await listTenants();
            // unwrap() in api/admin.ts already returns the 'data' array from the paginator
            // if the response follows { data: [...] } structure.
            if (Array.isArray(response)) {
                setTenants(response);
            } else if (response && response.data && Array.isArray(response.data)) {
                setTenants(response.data);
            } else {
                setTenants([]);
            }
        } catch (error) {
            console.error('Failed to load tenants', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTenants();
    }, []);

    const handleImpersonate = async (tenant: any) => {
        try {
            const res = await impersonateTenant(tenant.id);
            const { token, user, tenant: targetTenant } = res;

            // Set Auth and Redirect
            localStorage.setItem('auth_token', token);
            localStorage.setItem('tenant_id', targetTenant.id);
            if (targetTenant.slug) localStorage.setItem('tenant_slug', targetTenant.slug);

            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            api.defaults.headers.common['X-Tenant-ID'] = targetTenant.id;

            setAuth(user, targetTenant, token);

            toast({
                title: `Logged in as Admin for ${targetTenant.name}`,
                description: "You are now impersonating the tenant admin."
            });

            navigate('/');
        } catch (error) {
            console.error(error);
            toast({ variant: "destructive", title: "Impersonation Failed", description: "Could not login as tenant admin." });
        }
    };

    const handleStatusToggle = async (tenant: any) => {
        try {
            await updateTenant(tenant.id, { is_active: !tenant.is_active });
            toast({
                title: tenant.is_active ? 'Tenant Deactivated' : 'Tenant Activated',
                description: `Successfully ${tenant.is_active ? 'deactivated' : 'activated'} ${tenant.name}`,
            });
            loadTenants(); // Refresh list
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Update Failed',
                description: 'Could not update tenant status',
            });
        }
    };

    const handlePlanChange = async (tenant: any, newPlan: string) => {
        try {
            await updateTenant(tenant.id, { plan: newPlan });
            toast({
                title: 'Plan Updated',
                description: `${tenant.name} is now on ${newPlan} plan`,
            });
            loadTenants();
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Update Failed',
                description: 'Could not update tenant plan',
            });
        }
    };

    return (
        <SuperAdminLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Tenants</h1>
                    <p className="text-muted-foreground">
                        Manage registered businesses
                    </p>
                </div>

                <div className="rounded-md border bg-white">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Slug</TableHead>
                                <TableHead>Industry</TableHead>
                                <TableHead>Plan</TableHead>
                                <TableHead>Users</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Join Date</TableHead>
                                <TableHead className="w-[70px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                                    </TableRow>
                                ))
                            ) : tenants.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                                        No tenants found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                tenants.map((tenant) => (
                                    <TableRow key={tenant.id}>
                                        <TableCell className="font-medium">{tenant.name}</TableCell>
                                        <TableCell>{tenant.slug}</TableCell>
                                        <TableCell className="capitalize">{tenant.industry}</TableCell>
                                        <TableCell className="capitalize">{tenant.plan}</TableCell>
                                        <TableCell>
                                            {tenant.users_count ?? 0}
                                        </TableCell>
                                        <TableCell>
                                            {tenant.is_active ? (
                                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
                                            ) : (
                                                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Inactive</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {tenant.created_at ? format(new Date(tenant.created_at), 'MMM d, yyyy') : '-'}
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => handleImpersonate(tenant)}>
                                                        <CreditCard className="mr-2 h-4 w-4" /> Login as Admin
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => handleStatusToggle(tenant)}>
                                                        {tenant.is_active ? (
                                                            <>
                                                                <Pause className="mr-2 h-4 w-4" /> Deactivate
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Play className="mr-2 h-4 w-4" /> Activate
                                                            </>
                                                        )}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuLabel>Change Plan</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => handlePlanChange(tenant, 'basic')} disabled={tenant.plan === 'basic'}>
                                                        Basic (Free)
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handlePlanChange(tenant, 'professional')} disabled={tenant.plan === 'professional'}>
                                                        Professional
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handlePlanChange(tenant, 'enterprise')} disabled={tenant.plan === 'enterprise'}>
                                                        Enterprise
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </SuperAdminLayout>
    );
};
