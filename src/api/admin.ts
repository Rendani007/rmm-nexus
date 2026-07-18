import { api } from './axios';

// Helper to unwrap response
const unwrap = <T,>(p: any): T => (p && typeof p === 'object' && 'data' in p ? (p.data as T) : (p as T));

export interface AdminStats {
    total_tenants: number;
    active_tenants: number;
    recent_tenants: any[];
    mrr: number;
    arr: number;
    new_mrr: number;
    active_subscriptions: number;
    plan_distribution: { plan_name: string; count: number }[];
    revenue_chart: { month: string; revenue: number }[];
    arpu: number;
    churn_rate: number;
    ltv: number;
    total_global_items: number;
    total_global_movements: number;
    total_global_users: number;
}

export const getAdminStats = async (period: string = 'all_time') => {
    const res = await api.get(`/admin/stats?period=${period}`);
    return unwrap<AdminStats>(res.data);
};

export const fetchAuditLogs = async (filters?: any) => {
    const res = await api.get('/admin/audit-logs', { params: filters });
    return unwrap<any>(res.data);
};

export const listTenants = async (page = 1) => {
    const res = await api.get(`/admin/tenants?page=${page}`);
    return unwrap<any>(res.data);
};

export const getTenantDetails = async (id: string) => {
    const res = await api.get(`/admin/tenants/${id}`);
    return unwrap<any>(res.data);
};

export const updateTenant = async (id: string, data: { is_active?: boolean; plan?: string }) => {
    const res = await api.put(`/admin/tenants/${id}`, data);
    return unwrap<any>(res.data);
};

export const impersonateTenant = async (id: string) => {
    const res = await api.post(`/admin/tenants/${id}/impersonate`);
    return unwrap<any>(res.data);
};

export const clearSystemCache = async () => {
    const res = await api.post('/admin/system/clear-cache');
    return unwrap<{message: string}>(res.data);
};

export const restartQueueWorkers = async () => {
    const res = await api.post('/admin/system/restart-queue');
    return unwrap<{message: string}>(res.data);
};
