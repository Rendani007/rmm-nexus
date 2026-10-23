import { UUID, User, InventoryItem } from './index';

export interface Supplier {
  id: UUID;
  name: string;
  email?: string;
  phone?: string;
  contact_person?: string;
  tax_number?: string;
  bbbee_level?: string;
  address?: string;
  is_active: boolean;
  created_at?: string;
}

export interface PurchaseOrderItem {
  id: UUID;
  purchase_order_id: UUID;
  inventory_item_id: UUID;
  inventory_item?: InventoryItem; // the relation
  qty_ordered: number;
  qty_received: number;
  unit_price: number;
  total_price: number;
}

export interface PurchaseOrder {
  id: UUID;
  supplier_id: UUID;
  supplier?: Supplier;
  department_id?: UUID;
  reference_number: string;
  status: 'draft' | 'sent' | 'partially_received' | 'fulfilled' | 'cancelled';
  total_amount: number;
  notes?: string;
  created_by?: UUID;
  creator?: User;
  approved_by?: UUID;
  approver?: User;
  approved_at?: string;
  expected_delivery_date?: string;
  items?: PurchaseOrderItem[];
  created_at?: string;
}
