import React, { useEffect, useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Layout } from '@/components/Layout';
import { fetchTenantAuditLogs } from '@/api/audit';
import { format } from 'date-fns';
import { Loader2, Search, ShieldAlert } from 'lucide-react';
import { useAuthStore } from '@/features/auth/useAuthStore';

export function TenantAuditLogsPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuthStore();
    const [filters, setFilters] = useState({
        action: '',
    });

    const isAuthorized = user?.is_tenant_admin || user?.role === 'department_admin';

    const loadLogs = async () => {
        if (!isAuthorized) return;
        setLoading(true);
        try {
            const params: any = {};
            if (filters.action) params.action = filters.action;

            const response = await fetchTenantAuditLogs(params);
            
            // Handle pagination wrapper from Laravel
            if (response && response.data && Array.isArray(response.data)) {
                setLogs(response.data);
            } else if (Array.isArray(response)) {
                setLogs(response);
            } else if (response && response.items && Array.isArray(response.items)) {
                setLogs(response.items);
            } else {
                setLogs([]);
            }
        } catch (error) {
            console.error('Failed to load audit logs', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLogs();
    }, []);

    const getActionColor = (action: string) => {
        const a = action.toLowerCase();
        if (a.includes('delete') || a.includes('destroy') || a.includes('reject')) return 'destructive';
        if (a.includes('update') || a.includes('edit')) return 'secondary';
        if (a.includes('create') || a.includes('approve')) return 'default';
        if (a.includes('login')) return 'outline';
        return 'secondary';
    };

    if (!isAuthorized) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
                    <ShieldAlert className="h-12 w-12 text-destructive" />
                    <h1 className="text-2xl font-bold">Access Denied</h1>
                    <p className="text-muted-foreground">You do not have permission to view audit logs.</p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Audit Trails</h1>
                        <p className="text-muted-foreground">
                            Monitor system activity and changes for security and compliance.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Filter by action (e.g. create_item)..."
                            className="pl-8 bg-white"
                            value={filters.action}
                            onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                            onKeyDown={(e) => e.key === 'Enter' && loadLogs()}
                        />
                    </div>
                </div>

                <div className="rounded-md border bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Time</TableHead>
                                <TableHead>Action</TableHead>
                                <TableHead>User</TableHead>
                                <TableHead>IP Address</TableHead>
                                <TableHead>Details</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin inline" /> Loading logs...
                                    </TableCell>
                                </TableRow>
                            ) : logs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        No audit records found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                logs.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell className="whitespace-nowrap font-medium text-xs">
                                            {format(new Date(log.created_at), 'MMM dd, HH:mm:ss')}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={getActionColor(log.action) as any} className="capitalize">
                                                {log.action.replace(/_/g, ' ')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {log.user ? (
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-sm">{log.user.first_name} {log.user.last_name}</span>
                                                    <span className="text-[10px] text-muted-foreground">{log.user.email}</span>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground text-sm">System</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="font-mono text-[10px]">
                                            {log.ip_address}
                                        </TableCell>
                                        <TableCell className="max-w-[300px] truncate text-[10px] text-muted-foreground" title={JSON.stringify(log.details, null, 2)}>
                                            {log.details ? JSON.stringify(log.details) : '-'}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </Layout>
    );
}
