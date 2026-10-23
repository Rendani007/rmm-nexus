import { api } from './axios';
import { Supplier } from '../types/procurement';

export const supplierApi = {
  getSuppliers: async (): Promise<Supplier[]> => {
    const res = await api.get('/suppliers');
    return res.data.data;
  },

  getSupplier: async (id: string): Promise<Supplier> => {
    const res = await api.get(`/suppliers/${id}`);
    return res.data.data;
  },

  createSupplier: async (data: Partial<Supplier>): Promise<Supplier> => {
    const res = await api.post('/suppliers', data);
    return res.data.data;
  },

  updateSupplier: async (id: string, data: Partial<Supplier>): Promise<Supplier> => {
    const res = await api.put(`/suppliers/${id}`, data);
    return res.data.data;
  },

  deleteSupplier: async (id: string): Promise<void> => {
    await api.delete(`/suppliers/${id}`);
  }
};
