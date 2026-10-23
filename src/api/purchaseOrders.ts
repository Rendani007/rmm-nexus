import { api } from './axios';
import { PurchaseOrder } from '../types/procurement';

export interface CreatePurchaseOrderDto {
  supplier_id: string;
  department_id?: string;
  expected_delivery_date?: string;
  notes?: string;
  items: {
    inventory_item_id: string;
    qty_ordered: number;
    unit_price: number;
  }[];
}

export const purchaseOrderApi = {
  getPurchaseOrders: async (): Promise<PurchaseOrder[]> => {
    const res = await api.get('/purchase-orders');
    return res.data.data;
  },

  getPurchaseOrder: async (id: string): Promise<PurchaseOrder> => {
    const res = await api.get(`/purchase-orders/${id}`);
    return res.data.data;
  },

  createDraft: async (data: CreatePurchaseOrderDto): Promise<PurchaseOrder> => {
    const res = await api.post('/purchase-orders', data);
    return res.data.data;
  },

  submitOrder: async (id: string): Promise<PurchaseOrder> => {
    const res = await api.post(`/purchase-orders/${id}/submit`);
    return res.data.data;
  },

  approveOrder: async (id: string): Promise<PurchaseOrder> => {
    const res = await api.post(`/purchase-orders/${id}/approve`);
    return res.data.data;
  },

  receiveItems: async (id: string, payload: { to_location_id: string; items: { po_item_id: string; qty_received: number; }[] }): Promise<PurchaseOrder> => {
    const res = await api.post(`/purchase-orders/${id}/receive`, payload);
    return res.data.data;
  }
};
