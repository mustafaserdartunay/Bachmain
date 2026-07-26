/**
 * Tenant membership role → JWT permission codes.
 * Least-privilege matrix for commercial sales gate (docs/109).
 */

export const TENANT_ROLES = [
  'owner',
  'admin',
  'manager',
  'sales',
  'warehouse',
  'production',
  'accounting',
  'hr',
  'viewer',
  'guest',
] as const

export type TenantRole = (typeof TENANT_ROLES)[number]

const BASE_VIEW = ['crm.customers.view', 'dashboard.view'] as const

const ROLE_PERMS: Record<string, string[]> = {
  owner: ['*'],
  admin: ['*'],
  manager: [
    ...BASE_VIEW,
    'crm.customers.create',
    'crm.customers.update',
    'orders.view',
    'orders.create',
    'quotes.view',
    'quotes.create',
    'warehouse.view',
    'production.view',
    'finance.view',
    'social.view',
    'social.create',
    'social.approve',
    'social.publish',
    'social.connect',
  ],
  sales: [
    ...BASE_VIEW,
    'crm.customers.create',
    'crm.customers.update',
    'quotes.view',
    'quotes.create',
    'orders.view',
    'orders.create',
    'social.view',
    'social.create',
  ],
  warehouse: [...BASE_VIEW, 'warehouse.view', 'warehouse.mutate', 'orders.view', 'production.view'],
  production: [
    ...BASE_VIEW,
    'production.view',
    'production.mutate',
    'warehouse.view',
    'orders.view',
  ],
  accounting: [...BASE_VIEW, 'finance.view', 'finance.mutate', 'orders.view', 'crm.customers.view'],
  hr: [...BASE_VIEW, 'hr.view', 'hr.mutate'],
  viewer: [
    ...BASE_VIEW,
    'orders.view',
    'quotes.view',
    'warehouse.view',
    'production.view',
    'finance.view',
  ],
  guest: ['dashboard.view'],
}

/** Resolve JWT `perms` for a company membership role. */
export function permsForTenantRole(role: string | null | undefined): string[] {
  const key = String(role || 'viewer')
    .toLowerCase()
    .trim()
  if (ROLE_PERMS[key]) return [...ROLE_PERMS[key]]
  // Legacy aliases
  if (key === 'şirket sahibi' || key === 'sahip') return [...ROLE_PERMS.owner]
  if (key === 'yönetici') return [...ROLE_PERMS.admin]
  if (key === 'personel' || key === 'staff') return [...ROLE_PERMS.viewer]
  if (key === 'muhasebe') return [...ROLE_PERMS.accounting]
  if (key === 'depo') return [...ROLE_PERMS.warehouse]
  if (key === 'üretim' || key === 'uretim') return [...ROLE_PERMS.production]
  if (key === 'satış' || key === 'satis') return [...ROLE_PERMS.sales]
  if (key === 'misafir') return [...ROLE_PERMS.guest]
  return [...ROLE_PERMS.viewer]
}

export function roleAllows(role: string | null | undefined, ...codes: string[]): boolean {
  const perms = permsForTenantRole(role)
  if (perms.includes('*')) return true
  return codes.every((c) => perms.includes(c))
}
