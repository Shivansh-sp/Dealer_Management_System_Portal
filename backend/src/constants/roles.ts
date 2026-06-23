export enum UserRole {
  MASTER_ADMIN = 'Master Admin',
  SPARE_HOUSE_OFFICER = 'Spare House Officer',
  PURCHASE_MANAGER = 'Purchase Manager',
  FINANCE_MANAGER = 'Finance Manager',
  SERVICE_TECHNICIAN_OFFICER = 'Service Technician Officer',
  LEGAL_MANAGER = 'Legal Manager',
  SALES_MANAGER = 'Sales Manager',
  PRE_SALES_MANAGER = 'Pre Sales Manager',
  AFTER_SALES_MANAGER = 'After Sales Manager'
}

export type Permission =
  | 'manage_users'
  | 'view_dashboard'
  // Pre Sales
  | 'manage_leads'
  | 'manage_test_rides'
  | 'manage_quotations'
  | 'use_ownership_calculator'
  // Sales
  | 'manage_sales'
  | 'manage_inventory'
  | 'view_sales_analytics'
  // After Sales
  | 'manage_hsrp'
  | 'manage_warranty_claims'
  | 'use_resale_calculator'
  // Purchase
  | 'manage_purchase_orders'
  | 'manage_pdi'
  // Service
  | 'manage_service_bookings'
  | 'manage_technicians'
  | 'view_labor_prices'
  | 'manage_materials'
  | 'manage_gate_passes'
  | 'view_live_tracking'
  // System-wide
  | 'upload_documents'
  | 'view_logs';

export const RolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.MASTER_ADMIN]: [
    'manage_users',
    'view_dashboard',
    'manage_leads',
    'manage_test_rides',
    'manage_quotations',
    'use_ownership_calculator',
    'manage_sales',
    'manage_inventory',
    'view_sales_analytics',
    'manage_hsrp',
    'manage_warranty_claims',
    'use_resale_calculator',
    'manage_purchase_orders',
    'manage_pdi',
    'manage_service_bookings',
    'manage_technicians',
    'view_labor_prices',
    'manage_materials',
    'manage_gate_passes',
    'view_live_tracking',
    'upload_documents',
    'view_logs',
  ],
  [UserRole.PRE_SALES_MANAGER]: [
    'view_dashboard',
    'manage_leads',
    'manage_test_rides',
    'manage_quotations',
    'use_ownership_calculator',
    'view_live_tracking',
  ],
  [UserRole.SALES_MANAGER]: [
    'view_dashboard',
    'manage_sales',
    'manage_inventory',
    'view_sales_analytics',
    'upload_documents',
  ],
  [UserRole.AFTER_SALES_MANAGER]: [
    'view_dashboard',
    'manage_hsrp',
    'manage_warranty_claims',
    'use_resale_calculator',
    'view_live_tracking',
  ],
  [UserRole.PURCHASE_MANAGER]: [
    'view_dashboard',
    'manage_purchase_orders',
    'manage_inventory',
    'manage_pdi',
    'upload_documents',
  ],
  [UserRole.FINANCE_MANAGER]: [
    'view_dashboard',
    'view_sales_analytics',
    'manage_sales', // to approve invoices
    'view_labor_prices',
  ],
  [UserRole.SERVICE_TECHNICIAN_OFFICER]: [
    'view_dashboard',
    'manage_service_bookings',
    'manage_technicians',
    'view_labor_prices',
    'manage_materials',
    'manage_gate_passes',
    'view_live_tracking',
  ],
  [UserRole.SPARE_HOUSE_OFFICER]: [
    'view_dashboard',
    'manage_inventory', // spare parts inventory
    'manage_materials',
    'manage_gate_passes',
  ],
  [UserRole.LEGAL_MANAGER]: [
    'view_dashboard',
    'manage_warranty_claims',
    'upload_documents',
    'view_logs',
  ],
};
