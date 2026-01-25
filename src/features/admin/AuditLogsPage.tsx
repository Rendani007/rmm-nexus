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
import { SuperAdminLayout } from './SuperAdminLayout';
import { fetchAuditLogs } from '@/api/admin';
import { format } from 'date-fns';
import { Loader2, Search } from 'lucide-react';

export function AuditLogsPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        action: '',
    });

    const loadLogs = async () => {
        setLoading(true);
        try {
            // Only send filter if it has value
            const params: any = {};
            if (filters.action) params.action = filters.action;

            const response = await fetchAuditLogs(params);

            // Handle pagination wrapper
            if (response && response.data && Array.isArray(response.data)) {
                setLogs(response.data);
            } else if (Array.isArray(response)) {
                setLogs(response);
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
    }, []); // Reload when filters change? Or add button

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        loadLogs();
    };

    const getActionColor = (action: string) => {
        if (action.includes('delete') || action.includes('destroy')) return 'destructive';
        if (action.includes('update')) return 'secondary';
        if (action.includes('login')) return 'outline';
        return 'default';
    };

    return (
        <SuperAdminLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
                        <p className="text-muted-foreground">
                            Track system security and user activity for POPIA compliance.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Filter by action (e.g. login)..."
                            className="pl-8 bg-white"
                            value={filters.action}
                            onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                            onKeyDown={(e) => e.key === 'Enter' && loadLogs()}
                        />
                    </div>
                </div>

                <div className="rounded-md border bg-white">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Time</TableHead>
                                <TableHead>Action</TableHead>
                                <TableHead>User</TableHead>
                                <TableHead>Tenant</TableHead>
                                <TableHead>IP Address</TableHead>
                                <TableHead>Details</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin inline" /> Loading logs...
                                    </TableCell>
                                </TableRow>
                            ) : logs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        No audit records found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                logs.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell className="whitespace-nowrap font-medium">
                                            {format(new Date(log.created_at), 'MMM dd, HH:mm:ss')}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={getActionColor(log.action) as any}>
                                                {log.action}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {log.user ? (
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{log.user.first_name} {log.user.last_name}</span>
                                                    <span className="text-xs text-muted-foreground">{log.user.email}</span>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground">System/Unknown</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {log.tenant ? (
                                                <Badge variant="outline">{log.tenant.name}</Badge>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">
                                            {log.ip_address}
                                        </TableCell>
                                        <TableCell className="max-w-[300px] truncate text-xs text-muted-foreground" title={JSON.stringify(log.details, null, 2)}>
                                            {log.details ? JSON.stringify(log.details) : '-'}
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
}
