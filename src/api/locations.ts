import { api } from './axios';
import type { InventoryLocation } from '@/types';

// Unwrap pagination/envelope -> plain array
const unwrapArray = <T,>(payload: any): T[] => {
  if (Array.isArray(payload)) return payload as T[];
  if (Array.isArray(payload?.data)) return payload.data as T[];
  if (Array.isArray(payload?.data?.data)) return payload.data.data as T[]; // common "status/data/data" shape
  return [];
};

export const listLocations = async (params?: any): Promise<InventoryLocation[]> => {
  const res = await api.get('/inventory/locations', { params });
  return unwrapArray<InventoryLocation>(res.data);
};

export const createLocation = async (body: Partial<InventoryLocation>) => {
  const res = await api.post('/inventory/locations', body);
  return res.data?.data;
};

export const updateLocation = async (id: string, body: Partial<InventoryLocation>) => {
  const res = await api.put(`/inventory/locations/${id}`, body);
  return res.data?.data;
};

export const deleteLocation = async (id: string) => {
  const res = await api.delete(`/inventory/locations/${id}`);
  return res.data?.data;
};

export const showLocation = async (id: string) => {
  const res = await api.get(`/inventory/locations/${id}`);
  return res.data?.data;
};

export const getLocationStock = async (id: string) => {
  const res = await api.get(`/inventory/locations/${id}/stock`);
  return res.data?.data;
};