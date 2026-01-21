// src/api/items.ts
import { api } from './axios';
import type { InventoryItem, StockSummary } from '@/types';

const unwrapArray = (payload: any): InventoryItem[] => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data; // <— your case
  return [];
};

export const listItems = async (params?: any): Promise<InventoryItem[]> => {
  const res = await api.get('/inventory/items', { params });
  return unwrapArray(res.data);
};

export const createItem = async (body: Partial<InventoryItem>) => {
  const res = await api.post('/inventory/items', body);
  return res.data?.data;
};

export const updateItem = async (id: string, body: Partial<InventoryItem>) => {
  const res = await api.put(`/inventory/items/${id}`, body);
  return res.data?.data;
};

export const deleteItem = async (id: string) => {
  const res = await api.delete(`/inventory/items/${id}`);
  return res.data?.data;
};

export const showItem = async (id: string) => {
  const res = await api.get(`/inventory/items/${id}`);
  return res.data?.data;
};

export const stockForItem = async (id: string): Promise<StockSummary> => {
  const res = await api.get(`/inventory/items/${id}/stock`);
  return res.data?.data;
};

// Import/Export helpers
export const importItems = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const res = await api.post('/inventory/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
};

export const getExportUrl = () => {
  // We need to use the baseURL from axios instance, but simplify:
  // This assumes API is same origin or proxy. If not, we might need env var.
  // For now assuming Vite proxy or direct relative is OK if authenticated via Cookie/Header? 
  // Actually, `window.open` or `<a href>` won't send the Bearer token automatically if setup via axios interceptor.
  // This is a common issue. 
  // For download links with Sanctum/JWT:
  // Option 1: Pass token in URL ?token=... (Insecure but easy)
  // Option 2: Use axios to download blob (Good for auth, harder for UX)
  // Option 3: Cookies (Sanctum SPA uses cookies automatically for web routes, but we are in API routes 'auth:sanctum').

  // If we use axios blob download, we can trigger file save.
  return `/api/v1/inventory/export`;
};

export const downloadExport = async () => {
  try {
    const response = await api.get('/inventory/export', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    const filename = `inventory-export-${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (e) {
    console.error('Download failed', e);
    throw e;
  }
};

export const downloadTemplate = async () => {
  try {
    const response = await api.get('/inventory/import/template', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'inventory-template.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (e) {
    console.error('Download template failed', e);
    throw e;
  }
};
