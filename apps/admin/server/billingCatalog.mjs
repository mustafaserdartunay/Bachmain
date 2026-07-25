/**
 * Module codes used for plan entitlements and CRM sidebar gating.
 * Prices/assignments are dynamic; codes are stable identifiers.
 */

export const MODULE_CATALOG = [
  { code: 'crm', label: 'CRM / Müşteri Yönetimi', group: 'core' },
  { code: 'quotes', label: 'Teklif', group: 'core' },
  { code: 'orders', label: 'Sipariş', group: 'core' },
  { code: 'accounts', label: 'Cari Hesap', group: 'core' },
  { code: 'tasks', label: 'Görev', group: 'core' },
  { code: 'calendar', label: 'Takvim', group: 'core' },
  { code: 'notes', label: 'Not Defteri', group: 'core' },
  { code: 'appointments', label: 'Randevu', group: 'core' },
  { code: 'dashboard_basic', label: 'Temel Dashboard', group: 'core' },
  { code: 'reports_basic', label: 'Temel Raporlar', group: 'core' },
  { code: 'production', label: 'Üretim', group: 'ops' },
  { code: 'warehouse', label: 'Depo', group: 'ops' },
  { code: 'barcode', label: 'Barkod', group: 'ops' },
  { code: 'stock', label: 'Stok', group: 'ops' },
  { code: 'purchasing', label: 'Satın Alma', group: 'ops' },
  { code: 'sales', label: 'Satış', group: 'ops' },
  { code: 'pos', label: 'POS', group: 'ops' },
  { code: 'finance', label: 'Finans', group: 'ops' },
  { code: 'einvoice', label: 'e-Fatura', group: 'ops' },
  { code: 'earchive', label: 'e-Arşiv', group: 'ops' },
  { code: 'ewaybill', label: 'e-İrsaliye', group: 'ops' },
  { code: 'esign', label: 'E-İmza', group: 'ops' },
  { code: 'field_sales', label: 'Saha Satış', group: 'ops' },
  { code: 'dealer', label: 'Bayi Yönetimi', group: 'ops' },
  { code: 'b2b', label: 'B2B Portal', group: 'ops' },
  { code: 'whatsapp', label: 'WhatsApp', group: 'comms' },
  { code: 'sms', label: 'SMS', group: 'comms' },
  { code: 'courier', label: 'Kurye', group: 'ops' },
  { code: 'api', label: 'API', group: 'platform' },
  { code: 'api_advanced', label: 'Gelişmiş API', group: 'platform' },
  { code: 'webhook', label: 'Webhook', group: 'platform' },
  { code: 'dashboard_advanced', label: 'Gelişmiş Dashboard', group: 'platform' },
  { code: 'bi', label: 'BI Dashboard', group: 'platform' },
  { code: 'ai', label: 'Yapay Zeka / AI Asistan', group: 'platform' },
  { code: 'hr', label: 'İnsan Kaynakları', group: 'enterprise' },
  { code: 'mrp', label: 'MRP', group: 'enterprise' },
  { code: 'quality', label: 'Kalite Yönetimi', group: 'enterprise' },
  { code: 'approvals', label: 'Onay Süreçleri', group: 'enterprise' },
  { code: 'workflows', label: 'İş Akışları', group: 'enterprise' },
  { code: 'multi_company', label: 'Çoklu Şirket', group: 'enterprise' },
  { code: 'multi_branch', label: 'Çoklu Şube', group: 'enterprise' },
  { code: 'multi_warehouse', label: 'Çoklu Depo', group: 'enterprise' },
  { code: 'multi_currency', label: 'Çoklu Para Birimi', group: 'enterprise' },
  { code: 'truck', label: 'Tır Yönetimi', group: 'enterprise' },
  { code: 'pallet', label: 'Palet Yönetimi', group: 'enterprise' },
  { code: 'parcel', label: 'Koli Yönetimi', group: 'enterprise' },
  { code: 'packaging', label: 'Paket Yönetimi', group: 'enterprise' },
  { code: 'container', label: 'Konteyner', group: 'enterprise' },
  { code: 'reporting', label: 'Raporlama', group: 'platform' },
  { code: 'priority_support', label: 'Öncelikli Destek', group: 'support' },
  { code: 'sla', label: 'SLA Desteği', group: 'support' },
  { code: 'dedicated_am', label: 'Özel Müşteri Temsilcisi', group: 'support' },
]

export const STARTER_MODULES = [
  'crm',
  'quotes',
  'orders',
  'accounts',
  'tasks',
  'calendar',
  'notes',
  'appointments',
  'dashboard_basic',
  'reports_basic',
]

export const PROFESSIONAL_EXTRA = [
  'production',
  'warehouse',
  'barcode',
  'stock',
  'purchasing',
  'sales',
  'pos',
  'finance',
  'einvoice',
  'earchive',
  'field_sales',
  'dealer',
  'b2b',
  'whatsapp',
  'sms',
  'api',
  'dashboard_advanced',
  'reporting',
  'priority_support',
  'courier',
  'ewaybill',
  'esign',
]

export const ENTERPRISE_EXTRA = [
  'hr',
  'mrp',
  'quality',
  'approvals',
  'workflows',
  'multi_company',
  'multi_branch',
  'multi_warehouse',
  'multi_currency',
  'truck',
  'pallet',
  'parcel',
  'packaging',
  'container',
  'api_advanced',
  'webhook',
  'bi',
  'ai',
  'sla',
  'dedicated_am',
]

export function modulesForPlan(code) {
  const c = String(code || '').toLowerCase()
  if (c === 'enterprise' || c === 'kurumsal') {
    return [...new Set([...STARTER_MODULES, ...PROFESSIONAL_EXTRA, ...ENTERPRISE_EXTRA])]
  }
  if (c === 'professional' || c === 'pro' || c === 'profesyonel') {
    return [...new Set([...STARTER_MODULES, ...PROFESSIONAL_EXTRA])]
  }
  return [...STARTER_MODULES]
}

export const DEFAULT_ADDONS = [
  { code: 'whatsapp', label: 'WhatsApp', monthlyPrice: 490, yearlyPrice: 4900, trialDays: 7 },
  { code: 'sms', label: 'SMS', monthlyPrice: 290, yearlyPrice: 2900, trialDays: 7 },
  { code: 'esign', label: 'E-İmza', monthlyPrice: 390, yearlyPrice: 3900, trialDays: 7 },
  { code: 'einvoice', label: 'E-Fatura', monthlyPrice: 590, yearlyPrice: 5900, trialDays: 14 },
  { code: 'ewaybill', label: 'E-İrsaliye', monthlyPrice: 390, yearlyPrice: 3900, trialDays: 14 },
  { code: 'b2b', label: 'B2B', monthlyPrice: 990, yearlyPrice: 9900, trialDays: 7 },
  { code: 'pos', label: 'POS', monthlyPrice: 790, yearlyPrice: 7900, trialDays: 7 },
  { code: 'field_sales', label: 'Saha Satış', monthlyPrice: 690, yearlyPrice: 6900, trialDays: 7 },
  { code: 'courier', label: 'Kurye', monthlyPrice: 490, yearlyPrice: 4900, trialDays: 7 },
  { code: 'production', label: 'Üretim', monthlyPrice: 1290, yearlyPrice: 12900, trialDays: 7 },
  { code: 'hr', label: 'İK', monthlyPrice: 890, yearlyPrice: 8900, trialDays: 7 },
  { code: 'crm', label: 'CRM', monthlyPrice: 390, yearlyPrice: 3900, trialDays: 14 },
  { code: 'reporting', label: 'Raporlama', monthlyPrice: 490, yearlyPrice: 4900, trialDays: 7 },
  { code: 'api', label: 'API', monthlyPrice: 690, yearlyPrice: 6900, trialDays: 7 },
  { code: 'ai', label: 'Yapay Zeka', monthlyPrice: 990, yearlyPrice: 9900, trialDays: 7 },
]

export const DEFAULT_PLANS = [
  {
    code: 'starter',
    name: 'Starter',
    description: 'Küçük işletmeler ve yeni başlayan firmalar için temel CRM.',
    prices: {
      month: 499,
      year: 4990,
      year2: 9000,
      year3: 12900,
      year5: 19900,
      year10: 34900,
      lifetime: 49900,
    },
    maxUsers: 3,
    storageGb: 2,
    maxCompanies: 1,
    maxBranches: 1,
    maxWarehouses: 1,
    sortOrder: 1,
    active: true,
    modules: modulesForPlan('starter'),
  },
  {
    code: 'professional',
    name: 'Pro',
    description: 'Büyüyen KOBİ’ler için ERP ve operasyon paketleri.',
    prices: {
      month: 1499,
      year: 14990,
      year2: 27000,
      year3: 39000,
      year5: 59000,
      year10: 99000,
      lifetime: 149900,
    },
    maxUsers: 25,
    storageGb: 100,
    maxCompanies: 1,
    maxBranches: 3,
    maxWarehouses: 5,
    sortOrder: 2,
    active: true,
    modules: modulesForPlan('professional'),
  },
  {
    code: 'enterprise',
    name: 'Enterprise',
    description: 'Kurumsal firmalar için limitsiz ve gelişmiş özellikler.',
    prices: {
      month: 4999,
      year: 49990,
      year2: 90000,
      year3: 129000,
      year5: 199000,
      year10: 349000,
      lifetime: 0,
    },
    maxUsers: 0,
    storageGb: 0,
    maxCompanies: 0,
    maxBranches: 0,
    maxWarehouses: 0,
    sortOrder: 3,
    active: true,
    modules: modulesForPlan('enterprise'),
  },
]

export const PERIOD_MONTHS = {
  month: 1,
  year: 12,
  year2: 24,
  year3: 36,
  year5: 60,
  year10: 120,
  lifetime: 1200,
}

export function normalizePlanCode(raw) {
  const s = String(raw || '')
    .trim()
    .toLowerCase()
  if (/enter|kurum/.test(s)) return 'enterprise'
  if (/pro|profesyonel|professional|business/.test(s)) return 'professional'
  if (/free|trial|deneme/.test(s)) return 'starter'
  if (/start|başlangıç|baslangic/.test(s)) return 'starter'
  if (['starter', 'professional', 'enterprise'].includes(s)) return s
  return 'professional'
}

export function displayPlanName(code) {
  const map = { starter: 'Starter', professional: 'Professional', enterprise: 'Enterprise' }
  return map[normalizePlanCode(code)] || 'Professional'
}
