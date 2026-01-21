import { api, withIdem } from './axios';
import type { StockInBody, StockOutBody, StockTransferBody } from '@/types';

// These endpoints return plain objects; just return .data
export const stockIn = async (body: StockInBody) => {
  const res = await api.post('/inventory/stock/in', body, withIdem());
  return res.data?.data;
};

export const stockOut = async (body: StockOutBody) => {
  const res = await api.post('/inventory/stock/out', body, withIdem());
  return res.data?.data;
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
export const listTransferRequests = async (params: { status?: string; page?: number } = {}) => {
  const res = await api.get('/inventory/stock-transfers', { params });
  return res.data;
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