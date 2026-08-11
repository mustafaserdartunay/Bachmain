'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  MODULE_STORE_CART_KEY,
  MODULE_STORE_PERIOD_KEY,
  type BillingPeriod,
  type CartItem,
  type ModuleStoreCatalog,
  type StoreModule,
} from '../../data/moduleStoreTypes'
import { FALLBACK_MODULE_STORE, moduleUnitPrice } from '../../data/moduleStoreFallback'
import { fetchModuleStoreCatalog } from '../../utils/moduleStoreApi'

type Toast = { id: number; message: string; tone?: 'ok' | 'warn' }

type ModuleStoreContextValue = {
  loading: boolean
  catalog: ModuleStoreCatalog
  period: BillingPeriod
  setPeriod: (p: BillingPeriod) => void
  cartCodes: string[]
  cartModules: StoreModule[]
  category: string
  setCategory: (id: string) => void
  query: string
  setQuery: (q: string) => void
  filteredModules: StoreModule[]
  addToCart: (code: string) => void
  removeFromCart: (code: string) => void
  clearCart: () => void
  isInCart: (code: string) => boolean
  detailModule: StoreModule | null
  openDetail: (mod: StoreModule | null) => void
  mobileCartOpen: boolean
  setMobileCartOpen: (open: boolean) => void
  toast: Toast | null
  showToast: (message: string, tone?: Toast['tone']) => void
  totals: {
    subtotal: number
    yearlyAdvantage: number
    vat: number
    total: number
    count: number
  }
}

const ModuleStoreContext = createContext<ModuleStoreContextValue | null>(null)

function readCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(MODULE_STORE_CART_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeCart(items: CartItem[]) {
  try {
    localStorage.setItem(MODULE_STORE_CART_KEY, JSON.stringify(items))
  } catch {
    /* ignore */
  }
}

export function ModuleStoreProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [catalog, setCatalog] = useState<ModuleStoreCatalog>(FALLBACK_MODULE_STORE)
  const [period, setPeriodState] = useState<BillingPeriod>('month')
  const [cart, setCart] = useState<CartItem[]>([])
  const [category, setCategory] = useState('all')
  const [query, setQuery] = useState('')
  const [detailModule, setDetailModule] = useState<StoreModule | null>(null)
  const [mobileCartOpen, setMobileCartOpen] = useState(false)
  const [toast, setToast] = useState<Toast | null>(null)

  useEffect(() => {
    setCart(readCart())
    try {
      const saved = localStorage.getItem(MODULE_STORE_PERIOD_KEY)
      if (saved === 'year' || saved === 'month') setPeriodState(saved)
    } catch {
      /* ignore */
    }
    let cancelled = false
    ;(async () => {
      setLoading(true)
      const data = await fetchModuleStoreCatalog()
      if (!cancelled) {
        setCatalog(data)
        setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const showToast = useCallback((message: string, tone: Toast['tone'] = 'ok') => {
    const id = Date.now()
    setToast({ id, message, tone })
    window.setTimeout(() => {
      setToast((prev) => (prev?.id === id ? null : prev))
    }, 2600)
  }, [])

  const setPeriod = useCallback((p: BillingPeriod) => {
    setPeriodState(p)
    try {
      localStorage.setItem(MODULE_STORE_PERIOD_KEY, p)
    } catch {
      /* ignore */
    }
  }, [])

  const cartCodes = useMemo(() => cart.map((c) => c.code), [cart])

  const moduleByCode = useMemo(() => {
    const map = new Map<string, StoreModule>()
    for (const m of catalog.modules) map.set(m.code, m)
    return map
  }, [catalog.modules])

  const cartModules = useMemo(
    () => cartCodes.map((code) => moduleByCode.get(code)).filter(Boolean) as StoreModule[],
    [cartCodes, moduleByCode],
  )

  const filteredModules = useMemo(() => {
    const q = query.trim().toLowerCase()
    return catalog.modules.filter((m) => {
      if (category !== 'all' && m.category !== category) return false
      if (!q) return true
      return (
        m.name.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.features.some((f) => f.toLowerCase().includes(q))
      )
    })
  }, [catalog.modules, category, query])

  const addToCart = useCallback(
    (code: string) => {
      const mod = moduleByCode.get(code)
      if (!mod) return
      if (mod.isOwned) {
        showToast('Bu modül hesabınızda zaten aktif.', 'warn')
        return
      }
      setCart((prev) => {
        if (prev.some((i) => i.code === code)) {
          showToast('Bu modül zaten sepetinizde.', 'warn')
          return prev
        }
        const next = [...prev, { code, addedAt: Date.now() }]
        writeCart(next)
        showToast(`${mod.name} sepetinize eklendi.`)
        return next
      })
    },
    [moduleByCode, showToast],
  )

  const removeFromCart = useCallback((code: string) => {
    setCart((prev) => {
      const next = prev.filter((i) => i.code !== code)
      writeCart(next)
      return next
    })
  }, [])

  const clearCart = useCallback(() => {
    setCart([])
    writeCart([])
  }, [])

  const isInCart = useCallback((code: string) => cartCodes.includes(code), [cartCodes])

  const totals = useMemo(() => {
    const subtotal = cartModules.reduce((sum, m) => sum + moduleUnitPrice(m, period), 0)
    const listMonthly = cartModules.reduce((sum, m) => sum + moduleUnitPrice(m, 'month'), 0)
    const yearlyAdvantage =
      period === 'year' ? Math.max(0, listMonthly * 12 - subtotal) : 0
    const vat = Math.round(subtotal * (catalog.vatRate || 0.2) * 100) / 100
    const total = Math.round((subtotal + vat) * 100) / 100
    return {
      subtotal,
      yearlyAdvantage,
      vat,
      total,
      count: cartModules.length,
    }
  }, [cartModules, period, catalog.vatRate])

  const value: ModuleStoreContextValue = {
    loading,
    catalog,
    period,
    setPeriod,
    cartCodes,
    cartModules,
    category,
    setCategory,
    query,
    setQuery,
    filteredModules,
    addToCart,
    removeFromCart,
    clearCart,
    isInCart,
    detailModule,
    openDetail: setDetailModule,
    mobileCartOpen,
    setMobileCartOpen,
    toast,
    showToast,
    totals,
  }

  return <ModuleStoreContext.Provider value={value}>{children}</ModuleStoreContext.Provider>
}

export function useModuleStore() {
  const ctx = useContext(ModuleStoreContext)
  if (!ctx) throw new Error('useModuleStore must be used within ModuleStoreProvider')
  return ctx
}
