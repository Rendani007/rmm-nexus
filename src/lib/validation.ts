import { z } from 'zod';

export const itemSchema = z.object({
  sku: z.string().min(1, 'SKU is required').max(50, 'SKU must be 50 characters or less'),
  name: z.string().min(1, 'Name is required').max(255, 'Name must be 255 characters or less'),
  category: z.string().max(100, 'Category must be 100 characters or less').optional().or(z.literal('')),
  uom: z.string().min(1, 'Unit of measure is required').max(20, 'UoM must be 20 characters or less'),
  reorder_level: z.coerce.number().int().min(0, 'Reorder level must be 0 or greater').optional(),
  metadata: z.string().optional(),
});

export const locationSchema = z.object({
  code: z.string().min(1, 'Code is required').max(50, 'Code must be 50 characters or less'),
  name: z.string().min(1, 'Name is required').max(255, 'Name must be 255 characters or less'),
});

export const stockInSchema = z.object({
  inventory_item_id: z.string().uuid('Invalid item'),
  to_location_id: z.string().uuid('Invalid location'),
  qty: z.coerce.number().int().min(1, 'Quantity must be at least 1'),
  reference: z.string().max(100, 'Reference must be 100 characters or less').optional().or(z.literal('')),
  note: z.string().max(1000, 'Note must be 1000 characters or less').optional().or(z.literal('')),
});

export const stockOutSchema = z.object({
  inventory_item_id: z.string().uuid('Invalid item'),
  from_location_id: z.string().uuid('Invalid location'),
  qty: z.coerce.number().int().min(1, 'Quantity must be at least 1'),
  reference: z.string().max(100, 'Reference must be 100 characters or less').optional().or(z.literal('')),
  note: z.string().max(1000, 'Note must be 1000 characters or less').optional().or(z.literal('')),
});

export const stockTransferSchema = z.object({
  inventory_item_id: z.string().uuid('Invalid item'),
  from_location_id: z.string().uuid('Invalid location'),
  to_location_id: z.string().uuid('Invalid location'),
  qty: z.coerce.number().int().min(1, 'Quantity must be at least 1'),
  reference: z.string().max(100, 'Reference must be 100 characters or less').optional().or(z.literal('')),
  note: z.string().max(1000, 'Note must be 1000 characters or less').optional().or(z.literal('')),
}).refine((data) => data.from_location_id !== data.to_location_id, {
  message: 'From and To locations must be different',
  path: ['to_location_id'],
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  tenant_slug: z.string().min(1, 'Tenant slug is required'),
});

export const changePasswordSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  password_confirmation: z.string().min(1, 'Password confirmation is required'),
}).refine((data) => data.password === data.password_confirmation, {
  message: 'Passwords do not match',
  path: ['password_confirmation'],
});
