// src/api/items.ts
import { api } from './axios';
import type { InventoryItem, StockSummary } from '@/types';

const unwrapArray = (payload: any): InventoryItem[] => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data; // <— your case
  return [];
};

export const listItems = async (): Promise<InventoryItem[]> => {
  const res = await api.get('/inventory/items');
  return unwrapArray(res.data);
};

export const createItem  = async (body: Partial<InventoryItem>) =>
  (await api.post('/inventory/items', body)).data;

export const updateItem  = async (id: string, body: Partial<InventoryItem>) =>
  (await api.put(`/inventory/items/${id}`, body)).data;

export const deleteItem  = async (id: string) =>
  (await api.delete(`/inventory/items/${id}`)).data;

export const showItem    = async (id: string) =>
  (await api.get(`/inventory/items/${id}`)).data;

export const stockForItem = async (id: string): Promise<StockSummary> =>
  (await api.get(`/inventory/items/${id}/stock`)).data;
