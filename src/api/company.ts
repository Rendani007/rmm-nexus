// src/api/company.ts
import { api } from './axios';

export interface Company {
    id: string;
    name: string;
    slug: string;
    domain?: string;
    industry: string;
    plan: string;
    enabled_modules: string[];
    max_users: number;
    is_active: boolean;
    admin_email: string;
    phone?: string;
    address?: string;
    logo_path?: string;
    primary_color?: string;
    trial_ends_at?: string;
    on_trial: boolean;
    user_count: number;
    available_modules: string[];
}

export interface CompanyStats {
    total_users: number;
    active_users: number;
    admin_users: number;
    max_users: number;
    plan: string;
    enabled_modules: string[];
    on_trial: boolean;
    trial_ends_at?: string;
}

export interface UpdateCompanyBody {
    name?: string;
    domain?: string;
    admin_email?: string;
    phone?: string;
    address?: string;
    primary_color?: string;
    industry?: string;
}

const unwrap = <T,>(p: any): T => (p && typeof p === 'object' && 'data' in p ? (p.data as T) : (p as T));

export const getCompany = async () => {
    const res = await api.get('/company');
    return unwrap<Company>(res.data);
};

export const updateCompany = async (body: UpdateCompanyBody) => {
    const res = await api.put('/company', body);
    return unwrap<Company>(res.data);
};

export const getCompanyStats = async () => {
    const res = await api.get('/company/stats');
    return unwrap<CompanyStats>(res.data);
};
