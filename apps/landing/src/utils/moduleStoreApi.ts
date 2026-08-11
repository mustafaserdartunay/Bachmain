import { getYonetimApiBase } from './platformApi'
import { FALLBACK_MODULE_STORE } from '../data/moduleStoreFallback'
import type { BillingPeriod, ModuleStoreCatalog } from '../data/moduleStoreTypes'

function authToken(): string {
  try {
    return (
      localStorage.getItem('bachmain_token') ||
      localStorage.getItem('bachmain_access_token') ||
      sessionStorage.getItem('bachmain_token') ||
      ''
    )
  } catch {
    return ''
  }
}

export function isModuleStoreLoggedIn() {
  return Boolean(authToken())
}

export async function fetchModuleStoreCatalog(): Promise<ModuleStoreCatalog> {
  const base = getYonetimApiBase().replace(/\/$/, '')
  const headers: Record<string, string> = { Accept: 'application/json' }
  const token = authToken()
  if (token) headers.Authorization = `Bearer ${token}`

  try {
    const res = await fetch(`${base}/billing/module-store`, {
      method: 'GET',
      credentials: 'include',
      headers,
    })
    if (!res.ok) throw new Error(`HTTP_${res.status}`)
    const data = await res.json()
    if (!data?.modules?.length) throw new Error('EMPTY_CATALOG')
    return {
      categories: data.categories?.length ? data.categories : FALLBACK_MODULE_STORE.categories,
      modules: data.modules,
      yearlyDiscountPercent: data.yearlyDiscountPercent ?? 20,
      vatRate: data.vatRate ?? 0.2,
      currency: data.currency || 'TRY',
    }
  } catch {
    return FALLBACK_MODULE_STORE
  }
}

export async function checkoutModuleStore(body: {
  moduleCodes: string[]
  period: BillingPeriod
  method?: string
  companyInvoice?: boolean
  billingName?: string
  taxNo?: string
  acceptTerms?: boolean
}) {
  const base = getYonetimApiBase().replace(/\/$/, '')
  const token = authToken()
  if (!token) {
    const err = new Error('Oturum gerekli')
    ;(err as Error & { status?: number }).status = 401
    throw err
  }
  const res = await fetch(`${base}/billing/module-store/checkout`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.message || data.error || `HTTP_${res.status}`)
    ;(err as Error & { status?: number; code?: string }).status = res.status
    ;(err as Error & { code?: string }).code = data.error
    throw err
  }
  return data
}

export function loginRedirectForCheckout() {
  const next = encodeURIComponent('/paketler/moduller/odeme')
  return `/giris?next=${next}`
}
