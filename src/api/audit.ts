import { api } from './axios';

// Helper to unwrap response
const unwrap = <T,>(p: any): T => (p && typeof p === 'object' && 'data' in p ? (p.data as T) : (p as T));

/**
 * Fetch audit logs for the current tenant.
 * Scoped by the backend to Tenant Admin or Department Admin.
 */
export const fetchTenantAuditLogs = async (filters?: any) => {
    const res = await api.get('/audit-logs', { params: filters });
    return unwrap<any>(res.data);
};
