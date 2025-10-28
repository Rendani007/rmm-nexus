import { api } from './axios';
import type { InventoryItem, StockSummary } from '@/types';

export const listItems = () =>
  api.get<InventoryItem[]>('/inventory/items').then((r) => r.data);

export const createItem = (body: Partial<InventoryItem>) =>
  api.post<InventoryItem>('/inventory/items', body).then((r) => r.data);

export const updateItem = (id: string, body: Partial<InventoryItem>) =>
  api.put<InventoryItem>(`/inventory/items/${id}`, body).then((r) => r.data);

export const deleteItem = (id: string) =>
  api.delete(`/inventory/items/${id}`).then((r) => r.data);

export const showItem = (id: string) =>
  api.get<InventoryItem>(`/inventory/items/${id}`).then((r) => r.data);

export const stockForItem = (id: string) =>
  api.get<StockSummary>(`/inventory/items/${id}/stock`).then((r) => r.data);
