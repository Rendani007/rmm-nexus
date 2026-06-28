import { api, withIdem } from './axios';
import type { StockInBody, StockOutBody, StockTransferBody, StockTransferRequest } from '@/types';

const unwrap = (payload: any): any[] => {
  // If it's the top level axios res.data of { status: 'ok', data: [...] }
  // OR { status: 'ok', data: { data: [...] } }
  const data = payload?.data;
  if (Array.isArray(data)) return data; // { status: 'ok', data: [] }
  if (Array.isArray(data?.data)) return data.data; // { status: 'ok', data: { data: [] } }
  if (Array.isArray(payload)) return payload; // raw array
  return [];
};

// These endpoints return plain objects; just return .data
export const stockIn = async (body: StockInBody) => {
  const res = await api.post('/inventory/stock/in', body, withIdem());
  return res.data?.data;
};

export const stockOut = async (body: StockOutBody) => {
  const res = await api.post('/inventory/stock/out', body, withIdem());
  return res; // Return full response so caller can access low_stock_warning
};

export const stockTransfer = async (body: StockTransferBody) => {
  const res = await api.post('/inventory/stock/transfer', body, withIdem());
  return res.data?.data;
};

export const listStockMovements = async (params: { inventory_item_id?: string; page?: number; department_id?: string }) => {
  const res = await api.get('/inventory/stock/movements', { params });
  return res.data; // returns paginated object { data: [], current_page: ... }
};

// Approval Workflow
export const listTransferRequests = async (params: { status?: string; page?: number } = {}): Promise<StockTransferRequest[]> => {
  const res = await api.get('/inventory/stock-transfers', { params });
  return unwrap(res.data);
};

export const createTransferRequest = async (body: any) => {
  const res = await api.post('/inventory/stock-transfers', body, withIdem());
  return res.data;
};

export const approveTransfer = async (id: string, body: { to_location_id: string }) => {
  const res = await api.post(`/inventory/stock-transfers/${id}/approve`, body, withIdem());
  return res.data;
};

export const rejectTransfer = async (id: string) => {
  const res = await api.post(`/inventory/stock-transfers/${id}/reject`, {}, withIdem());
  return res.data;
};

export const getPendingTransferCount = async () => {
  const res = await api.get('/inventory/stock-transfers/pending-count');
  return res.data?.data?.count ?? 0;
};

export const getStockBalance = async (itemId: string, locationId: string): Promise<number> => {
  const res = await api.get('/inventory/stock/balance', { params: { item_id: itemId, location_id: locationId } });
  return res.data?.data?.available ?? 0;
};

export const getAvailableBatches = async (itemId: string, locationId: string): Promise<{batch_number: string, available: number}[]> => {
  const res = await api.get('/inventory/stock/batches', { params: { item_id: itemId, location_id: locationId } });
  return res.data?.data ?? [];
};

/** Returns a map of { [locationId]: available } for a given item across all provided locations */
export const getStockBalancesForItem = async (
  itemId: string,
  locationIds: string[]
): Promise<Record<string, number>> => {
  const results = await Promise.allSettled(
    locationIds.map(lid =>
      api.get('/inventory/stock/balance', { params: { item_id: itemId, location_id: lid } })
        .then(res => ({ lid, qty: res.data?.data?.available ?? 0 }))
    )
  );
  const map: Record<string, number> = {};
  for (const r of results) {
    if (r.status === 'fulfilled') map[r.value.lid] = r.value.qty;
  }
  return map;
};