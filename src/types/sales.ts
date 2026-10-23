export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  contact_person?: string;
  tax_number?: string;
  billing_address?: string;
  shipping_address?: string;
  is_active: boolean;
  created_at: string;
}

export interface SalesOrderItem {
  id: string;
  sales_order_id: string;
  inventory_item_id: string;
  qty_ordered: number;
  qty_dispatched: number;
  unit_price: number;
  total_price: number;
  inventory_item?: {
    id: string;
    name: string;
    sku: string;
  };
}

export interface SalesOrder {
  id: string;
  customer_id: string;
  department_id?: string;
  reference_number: string;
  status: 'draft' | 'confirmed' | 'picking' | 'partially_dispatched' | 'fulfilled' | 'cancelled';
  total_amount: number;
  notes?: string;
  expected_dispatch_date?: string;
  created_at: string;
  customer?: Customer;
  items?: SalesOrderItem[];
  creator?: {
    id: string;
    first_name: string;
    last_name: string;
  };
  approver?: {
    id: string;
    first_name: string;
    last_name: string;
  };
}
