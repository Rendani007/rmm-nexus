import { api } from './axios';
import { Customer, SalesOrder } from '../types/sales';

export const customerApi = {
  getCustomers: async (): Promise<Customer[]> => {
    const res = await api.get('/customers');
    return res.data.data;
  },

  createCustomer: async (data: Partial<Customer>): Promise<Customer> => {
    const res = await api.post('/customers', data);
    return res.data.data;
  },

  updateCustomer: async (id: string, data: Partial<Customer>): Promise<Customer> => {
    const res = await api.put(`/customers/${id}`, data);
    return res.data.data;
  },

  deleteCustomer: async (id: string): Promise<void> => {
    await api.delete(`/customers/${id}`);
  }
};

export const salesOrderApi = {
  getSalesOrders: async (): Promise<SalesOrder[]> => {
    const res = await api.get('/sales-orders');
    return res.data.data;
  },

  getSalesOrder: async (id: string): Promise<SalesOrder> => {
    const res = await api.get(`/sales-orders/${id}`);
    return res.data.data;
  },

  createDraft: async (data: any): Promise<SalesOrder> => {
    const res = await api.post('/sales-orders', data);
    return res.data.data;
  },

  confirmOrder: async (id: string): Promise<SalesOrder> => {
    const res = await api.post(`/sales-orders/${id}/confirm`);
    return res.data.data;
  },

  dispatchItems: async (id: string, payload: { from_location_id: string; items: { so_item_id: string; qty_dispatched: number; }[] }): Promise<SalesOrder> => {
    const res = await api.post(`/sales-orders/${id}/dispatch`, payload);
    return res.data.data;
  }
};
