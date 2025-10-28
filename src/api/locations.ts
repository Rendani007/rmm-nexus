import { api } from './axios';
import type { InventoryLocation } from '@/types';

export const listLocations = () =>
  api.get<InventoryLocation[]>('/inventory/locations').then((r) => r.data);

export const createLocation = (body: Partial<InventoryLocation>) =>
  api.post<InventoryLocation>('/inventory/locations', body).then((r) => r.data);

export const updateLocation = (id: string, body: Partial<InventoryLocation>) =>
  api.put<InventoryLocation>(`/inventory/locations/${id}`, body).then((r) => r.data);

export const deleteLocation = (id: string) =>
  api.delete(`/inventory/locations/${id}`).then((r) => r.data);

export const showLocation = (id: string) =>
  api.get<InventoryLocation>(`/inventory/locations/${id}`).then((r) => r.data);
