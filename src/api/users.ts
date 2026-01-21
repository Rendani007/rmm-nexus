// src/api/users.ts
import { api } from './axios';

export interface User {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    job_title?: string;
    department?: string; // Legacy text field or relationship?
    department_id?: string;
    employee_id?: string;
    is_active: boolean;
    is_tenant_admin: boolean;
    last_login_at?: string;
    created_at: string;
    roles?: { name: string }[];
}

export interface CreateUserBody {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    password_confirmation: string;
    job_title?: string;
    department_id?: string;
    employee_id?: string;
    is_tenant_admin?: boolean;
}

export interface UpdateUserBody {
    first_name?: string;
    last_name?: string;
    email?: string;
    job_title?: string;
    department_id?: string;
    employee_id?: string;
    is_tenant_admin?: boolean;
    is_active?: boolean;
    role?: 'department_admin' | 'user'; // Virtual field for assignment
    password?: string;
    password_confirmation?: string;
}

const unwrap = <T,>(p: any): T => (p && typeof p === 'object' && 'data' in p ? (p.data as T) : (p as T));

export const listUsers = async (params?: { q?: string; is_active?: boolean; per_page?: number }) => {
    const res = await api.get('/users', { params });
    return unwrap<{ data: User[]; meta?: any }>(res.data);
};

export const getUser = async (userId: string) => {
    const res = await api.get(`/users/${userId}`);
    return unwrap<User>(res.data);
};

export const createUser = async (body: CreateUserBody) => {
    const res = await api.post('/auth/register', body);
    return unwrap<User>(res.data);
};

export const updateUser = async (userId: string, body: UpdateUserBody) => {
    const res = await api.put(`/users/${userId}`, body);
    return unwrap<User>(res.data);
};

export const deleteUser = async (userId: string) => {
    const res = await api.delete(`/users/${userId}`);
    return unwrap(res.data);
};
