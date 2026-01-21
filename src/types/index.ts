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
  department_id?: UUID;
  is_tenant_admin: boolean;
  is_super_admin?: boolean;
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
  stock_on_hand?: number;
  created_at?: string;
  updated_at?: string;
}

export interface InventoryLocation {
  id: UUID;
  tenant_id: UUID;
  code: string;
  name: string;
  total_items?: number;
  stock_on_hand?: number;
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

export type CustomFieldType = 'text' | 'number' | 'date' | 'boolean' | 'select';

export interface CustomFieldDefinition {
  id: UUID;
  tenant_id: UUID;
  entity_type: string;
  field_key: string;
  label: string;
  type: CustomFieldType;
  options?: any;
  sort_order: number;
  is_system: boolean;
  is_required: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCustomFieldBody {
  entity_type: string;
  label: string;
  type: CustomFieldType;
  options?: any;
  sort_order?: number;
  is_required?: boolean;
}

export interface DashboardStats {
  low_stock_count: number;
  total_stock_value: number;
}

export interface Department {
  id: UUID;
  name: string;
  budget_limit: number;
  currency: string;
  concurrency_code: string;
}

export interface StockTransferRequest {
  id: UUID;
  from_department_id: UUID;
  to_department_id: UUID;
  inventory_item_id: UUID;
  qty: number;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  created_at: string;
  item?: InventoryItem;
  from_department?: Department;
  to_department?: Department;
  creator?: User;
}

export interface CreateTransferRequestBody {
  inventory_item_id: UUID;
  to_department_id: UUID;
  from_location_id: UUID;
  qty: number;
  notes?: string;
}

