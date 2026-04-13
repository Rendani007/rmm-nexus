import { api } from './axios';
import type { CustomFieldDefinition, CreateCustomFieldBody } from '@/types';

const BASE_URL = '/custom-fields';

// Helper to unwrap response
const unwrap = <T,>(p: any): T => (p && typeof p === 'object' && 'data' in p ? (p.data as T) : (p as T));

export const getCustomFields = async (entityType = 'inventory_item', departmentId?: string): Promise<CustomFieldDefinition[]> => {
    const params: any = { entity_type: entityType };
    if (departmentId !== undefined) {
        params.department_id = departmentId;
    }
    const res = await api.get(BASE_URL, { params });
    return unwrap<CustomFieldDefinition[]>(res.data);
};


export const createCustomField = async (body: CreateCustomFieldBody): Promise<CustomFieldDefinition> => {
    const res = await api.post(BASE_URL, body);
    return unwrap<CustomFieldDefinition>(res.data);
};

export const updateCustomField = async (id: string, body: Partial<CreateCustomFieldBody>): Promise<CustomFieldDefinition> => {
    const res = await api.put(`${BASE_URL}/${id}`, body);
    return unwrap<CustomFieldDefinition>(res.data);
};

export const deleteCustomField = async (id: string): Promise<void> => {
    await api.delete(`${BASE_URL}/${id}`);
};

export const bulkDeleteCustomFields = async (ids: string[]): Promise<{ message: string; deleted_count: number }> => {
    const res = await api.post(`${BASE_URL}/bulk-delete`, { ids });
    return unwrap<{ message: string; deleted_count: number }>(res.data);
};
