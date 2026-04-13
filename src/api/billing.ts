import { api } from './axios';

export interface Plan {
    id: string;
    name: string;
    price: number;
    price_zar: number;
    users: number | string;
    features: string[];
    recommended?: boolean;
}

export interface CheckoutResponse {
    url: string;
    fields: Record<string, string>;
}

export const getPlans = async (): Promise<Plan[]> => {
    const res = await api.get('/billing/plans');
    return res.data.data || res.data;
};

export const startCheckout = async (planId: string): Promise<CheckoutResponse> => {
    const res = await api.post('/billing/checkout', { plan_id: planId });
    return res.data.data || res.data;
};
