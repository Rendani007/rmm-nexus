import { api } from './axios';

export interface Department {
    id: string;
    tenant_id: string;
    name: string;
    description?: string;
    budget_limit?: number;
    currency: string;
    created_at: string;
    updated_at: string;
    users_count?: number;
    inventory_items_count?: number;
    inventory_locations_count?: number;
}

export interface DepartmentStats {
    total_stock_value: number;
    budget_usage_percent: number;
}

export const getDepartments = async (params?: any) => {
    const { data } = await api.get('/departments', { params });
    return data;
};

export const getDepartment = async (id: string) => {
    const { data } = await api.get(`/departments/${id}`);
    return data;
};

export const createDepartment = async (department: Partial<Department>) => {
    const { data } = await api.post('/departments', department);
    return data;
};

export const updateDepartment = async (id: string, department: Partial<Department>) => {
    const { data } = await api.put(`/departments/${id}`, department);
    return data;
};

export const deleteDepartment = async (id: string) => {
    const { data } = await api.delete(`/departments/${id}`);
    return data;
};
