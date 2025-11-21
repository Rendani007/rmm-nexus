export type UUID = string;

export interface Tenant {
  id: UUID;
  name: string;
  slug: string;
  industry: string;
  enabled_modules: string[];
  plan: string;
  primary_color?: string;
}

export interface User {
  id: UUID;
  first_name: string;
  last_name: string;
  email: string;
  job_title?: string;
  department?: string;
  is_tenant_admin: boolean;
  must_change_password?: boolean;
}

export interface AuthLoginBody {
  email: string;
  password: string;
  tenant_slug: string;
}

export interface AuthLoginResp {
  message?: string;        // ← optional
  user: User;
  tenant: Tenant;
  token: string;
  expires_at?: string;     // ← optional
}

export interface InventoryItem {
  id: UUID;
  tenant_id: UUID;
  sku: string;
  name: string;
  category?: string;
  uom: string;
  reorder_level?: number;
  metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

export interface InventoryLocation {
  id: UUID;
  tenant_id: UUID;
  code: string;
  name: string;
  created_at?: string;
  updated_at?: string;
}

export interface StockSummary {
  item_id: UUID;
  stock_by_location: {
    location_id: UUID;
    code: string;
    name: string;
    qty: number;
  }[];
  total: number;
}

export interface StockInBody {
  inventory_item_id: UUID;
  to_location_id: UUID;
  qty: number;
  reference?: string;
  note?: string;
}

export interface StockOutBody {
  inventory_item_id: UUID;
  from_location_id: UUID;
  qty: number;
  reference?: string;
  note?: string;
}

export interface StockTransferBody {
  inventory_item_id: UUID;
  from_location_id: UUID;
  to_location_id: UUID;
  qty: number;
  reference?: string;
  note?: string;
}
