import { api } from './axios';
import type { Incident, Risk } from '@/types';

export const getIncidents = async (): Promise<Incident[]> => {
  const response = await api.get('/security/incidents');
  return response.data;
};

export const createIncident = async (data: Partial<Incident>): Promise<Incident> => {
  const response = await api.post('/security/incidents', data);
  return response.data;
};

export const updateIncident = async (id: string, data: Partial<Incident>): Promise<Incident> => {
  const response = await api.put(`/security/incidents/${id}`, data);
  return response.data;
};

export const deleteIncident = async (id: string): Promise<void> => {
  await api.delete(`/security/incidents/${id}`);
};

export const getRisks = async (): Promise<Risk[]> => {
  const response = await api.get('/security/risks');
  return response.data;
};

export const createRisk = async (data: Partial<Risk>): Promise<Risk> => {
  const response = await api.post('/security/risks', data);
  return response.data;
};

export const updateRisk = async (id: string, data: Partial<Risk>): Promise<Risk> => {
  const response = await api.put(`/security/risks/${id}`, data);
  return response.data;
};

export const deleteRisk = async (id: string): Promise<void> => {
  await api.delete(`/security/risks/${id}`);
};
