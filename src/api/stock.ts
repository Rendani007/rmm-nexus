import { api, withIdem } from './axios';
import type { StockInBody, StockOutBody, StockTransferBody } from '@/types';

export const stockIn = (body: StockInBody) =>
  api.post('/inventory/stock/in', body, withIdem()).then((r) => r.data);

export const stockOut = (body: StockOutBody) =>
  api.post('/inventory/stock/out', body, withIdem()).then((r) => r.data);

export const stockTransfer = (body: StockTransferBody) =>
  api.post('/inventory/stock/transfer', body, withIdem()).then((r) => r.data);
