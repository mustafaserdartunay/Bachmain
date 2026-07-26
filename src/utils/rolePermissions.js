/**
 * Client mirror of apps/api/src/shared/rolePermissions.ts
 * Keep codes in sync when expanding RBAC.
 */

const BASE_VIEW = ['crm.customers.view', 'dashboard.view']

const ROLE_PERMS = {
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

const ALIASES = {
  sahip: 'owner',
  'şirket sahibi': 'owner',
  yönetici: 'admin',
  personel: 'viewer',
  staff: 'viewer',
  muhasebe: 'accounting',
  depo: 'warehouse',
  üretim: 'production',
  uretim: 'production',
  satış: 'sales',
  satis: 'sales',
  misafir: 'guest',
}

export function normalizeTenantRole(role) {
  const key = String(role || 'viewer')
    .toLowerCase()
    .trim()
  return ALIASES[key] || key
}

export function permsForClientRole(role) {
  const key = normalizeTenantRole(role)
  return ROLE_PERMS[key] ? [...ROLE_PERMS[key]] : [...ROLE_PERMS.viewer]
}

export function roleAllowsClient(role, ...codes) {
  const perms = permsForClientRole(role)
  if (perms.includes('*')) return true
  return codes.every((c) => perms.includes(c))
}
