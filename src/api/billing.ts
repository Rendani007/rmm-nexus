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

export interface CheckoutPayload {
    plan_slug: string;
    max_users?: number;
    max_locations?: number;
    advanced_scanning?: boolean;
    risk_management?: boolean;
    api_access?: boolean;
}

export const startCheckout = async (payload: CheckoutPayload): Promise<CheckoutResponse> => {
    const res = await api.post('/billing/checkout', payload);
    return res.data.data || res.data;
};
