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
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { MoreHorizontal, Play, Pause, CreditCard, ShieldAlert, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export const TenantsListPage = () => {
    const [tenants, setTenants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTenant, setSelectedTenant] = useState<any | null>(null);
    const { setAuth } = useAuthStore();
    const navigate = useNavigate();
    const [actionLoading, setActionLoading] = useState<string | null>(null);

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
        } catch (error: any) {
            console.error('Failed to load tenants', error);
            toast({ variant: 'destructive', title: 'Error', description: error?.response?.data?.message || 'We could not load the tenants list. Please refresh the page.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTenants();
    }, []);

    const handleImpersonate = async (tenant: any) => {
        setActionLoading(`impersonate-${tenant.id}`);
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
        } catch (error: any) {
            console.error(error);
            toast({ variant: "destructive", title: "Impersonation Failed", description: error?.response?.data?.message || "We could not log you in as a tenant admin at this time. Please try again later." });
        } finally {
            setActionLoading(null);
        }
    };

    const handleStatusToggle = async (tenant: any) => {
        setActionLoading(`status-${tenant.id}`);
        try {
            await updateTenant(tenant.id, { is_active: !tenant.is_active });
            toast({
                title: tenant.is_active ? 'Tenant Deactivated' : 'Tenant Activated',
                description: `Successfully ${tenant.is_active ? 'deactivated' : 'activated'} ${tenant.name}`,
            });
            loadTenants(); // Refresh list
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Update Failed',
                description: error?.response?.data?.message || 'We encountered a problem updating the tenant status. Please try again.',
            });
        } finally {
            setActionLoading(null);
        }
    };

    const handlePlanChange = async (tenant: any, newPlan: string) => {
        setActionLoading(`plan-${tenant.id}`);
        try {
            await updateTenant(tenant.id, { plan: newPlan });
            toast({
                title: 'Plan Updated',
                description: `${tenant.name} is now on ${newPlan} plan`,
            });
            loadTenants();
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Update Failed',
                description: error?.response?.data?.message || 'We encountered a problem updating the tenant plan. Please try again.',
            });
        } finally {
            setActionLoading(null);
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
                                                    <DropdownMenuItem onClick={() => setSelectedTenant(tenant)}>
                                                        View Details
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleImpersonate(tenant)}>
                                                        <CreditCard className="mr-2 h-4 w-4" /> Login as Admin
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => handleStatusToggle(tenant)} className={tenant.is_active ? "text-red-600 focus:text-red-600" : "text-green-600 focus:text-green-600"}>
                                                        {tenant.is_active ? (
                                                            <>
                                                                <ShieldAlert className="mr-2 h-4 w-4" /> Suspend Tenant
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Play className="mr-2 h-4 w-4" /> Restore Access
                                                            </>
                                                        )}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuLabel>Force Plan Change</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => handlePlanChange(tenant, 'starter')} disabled={tenant.plan === 'starter'}>
                                                        Starter
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

            {/* Slide-out Details Panel */}
            <Sheet open={!!selectedTenant} onOpenChange={(open) => !open && setSelectedTenant(null)}>
                <SheetContent className="sm:max-w-xl overflow-y-auto">
                    {selectedTenant && (
                        <>
                            <SheetHeader className="mb-6">
                                <SheetTitle className="text-2xl">{selectedTenant.name}</SheetTitle>
                                <SheetDescription>
                                    Registered via subdomain <span className="font-medium text-foreground">{selectedTenant.slug}</span>
                                </SheetDescription>
                            </SheetHeader>

                            <div className="space-y-6">
                                {/* Status Card */}
                                <div className="p-4 bg-muted rounded-lg border flex items-center justify-between">
                                    <div>
                                        <div className="text-sm font-medium text-muted-foreground mb-1">Account Status</div>
                                        {selectedTenant.is_active ? (
                                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active & Accessible</Badge>
                                        ) : (
                                            <Badge variant="destructive">Suspended</Badge>
                                        )}
                                    </div>
                                    <Button 
                                        variant={selectedTenant.is_active ? "destructive" : "default"} 
                                        size="sm"
                                        onClick={() => handleStatusToggle(selectedTenant)}
                                        disabled={actionLoading === `status-${selectedTenant.id}`}
                                    >
                                        {actionLoading === `status-${selectedTenant.id}` && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {selectedTenant.is_active ? "Suspend Access" : "Restore Access"}
                                    </Button>
                                </div>

                                {/* Subscription details */}
                                <div>
                                    <h3 className="text-lg font-semibold mb-4 border-b pb-2">Subscription Details</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <div className="text-sm text-muted-foreground">Current Plan</div>
                                            <div className="font-medium capitalize">{selectedTenant.plan}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-muted-foreground">User Limit</div>
                                            <div className="font-medium">{selectedTenant.max_users || 'Unlimited'}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-muted-foreground">Registered Date</div>
                                            <div className="font-medium">{selectedTenant.created_at ? format(new Date(selectedTenant.created_at), 'PPP') : '-'}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-muted-foreground">Admin Contact</div>
                                            <div className="font-medium">{selectedTenant.admin_email || 'Not provided'}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Danger Zone */}
                                <div className="pt-6">
                                    <h3 className="text-lg font-semibold text-red-600 mb-4 border-b pb-2">Admin Actions</h3>
                                    <div className="flex flex-col gap-3">
                                        <Button variant="outline" className="w-full justify-start" onClick={() => handleImpersonate(selectedTenant)} disabled={actionLoading === `impersonate-${selectedTenant.id}`}>
                                            {actionLoading === `impersonate-${selectedTenant.id}` ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />} Impersonate Tenant Admin
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </SheetContent>
            </Sheet>
        </SuperAdminLayout>
    );
};
