import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { api, getAccessToken } from '@/lib/api'
import type {
  WebsiteEntitlements,
  WebsiteOverview,
  WebsiteSite,
} from '@/types/website'

const SITE_KEY = 'wos_active_site_id'
const DEMO_SITE: WebsiteSite = {
  id: '00000000-0000-4000-8000-000000000001',
  companyId: 'demo',
  name: 'Dropelya',
  slug: 'dropelya',
  status: 'draft',
  locale: 'tr',
  timezone: 'Europe/Istanbul',
  updatedAt: new Date().toISOString(),
}

const DEMO_ENTITLEMENTS: WebsiteEntitlements = {
  maxSites: 1,
  maxPagesPerSite: 20,
  maxStorageMb: 500,
  customDomain: false,
  ecommerceEnabled: false,
  removeBranding: false,
  source: 'demo',
  features: { planHint: 'Web Başlangıç (demo)' },
}

type SiteContextValue = {
  sites: WebsiteSite[]
  site: WebsiteSite | null
  overview: WebsiteOverview | null
  entitlements: WebsiteEntitlements | null
  loading: boolean
  demoMode: boolean
  error: string
  setActiveSiteId: (id: string) => void
  refresh: () => Promise<void>
  patchSiteLocal: (patch: Partial<WebsiteSite>) => void
}

const SiteContext = createContext<SiteContextValue | null>(null)

export function SiteProvider({ children }: { children: ReactNode }) {
  const [sites, setSites] = useState<WebsiteSite[]>([])
  const [siteId, setSiteId] = useState(() => localStorage.getItem(SITE_KEY) || '')
  const [overview, setOverview] = useState<WebsiteOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [demoMode, setDemoMode] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    const token = getAccessToken()
    if (!token) {
      setDemoMode(true)
      setSites([DEMO_SITE])
      setSiteId(DEMO_SITE.id)
      setOverview({
        phase: 'faz-2',
        site: DEMO_SITE,
        siteCount: 1,
        pageCount: 0,
        mediaCount: 0,
        domainCount: 0,
        productCount: null,
        orderCount: null,
        viewsCount: null,
        storageUsedMb: 0,
        storageMaxMb: DEMO_ENTITLEMENTS.maxStorageMb,
        domainStatus: 'not_connected',
        sslStatus: 'pending',
        entitlements: DEMO_ENTITLEMENTS,
        analyticsReady: false,
        ecommerceReady: false,
      })
      setLoading(false)
      return
    }
    try {
      const list = await api<{ sites: WebsiteSite[] }>('/v1/website/sites')
      const nextSites = list.sites || []
      setSites(nextSites)
      const active =
        nextSites.find((s) => s.id === siteId)?.id || nextSites[0]?.id || ''
      if (active && active !== siteId) {
        setSiteId(active)
        localStorage.setItem(SITE_KEY, active)
      }
      const ov = await api<WebsiteOverview>(
        `/v1/website/overview${active ? `?websiteId=${active}` : ''}`,
      )
      setOverview(ov)
      setDemoMode(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Yüklenemedi')
      setDemoMode(true)
      setSites([DEMO_SITE])
      setSiteId(DEMO_SITE.id)
      setOverview({
        phase: 'faz-2',
        site: DEMO_SITE,
        siteCount: 1,
        pageCount: 0,
        mediaCount: 0,
        domainCount: 0,
        productCount: null,
        orderCount: null,
        viewsCount: null,
        storageUsedMb: 0,
        storageMaxMb: DEMO_ENTITLEMENTS.maxStorageMb,
        domainStatus: 'not_connected',
        sslStatus: 'pending',
        entitlements: DEMO_ENTITLEMENTS,
        analyticsReady: false,
        ecommerceReady: false,
      })
    } finally {
      setLoading(false)
    }
  }, [siteId])

  useEffect(() => {
    void refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const setActiveSiteId = useCallback((id: string) => {
    setSiteId(id)
    localStorage.setItem(SITE_KEY, id)
  }, [])

  useEffect(() => {
    if (!siteId || demoMode || !getAccessToken()) return
    void (async () => {
      try {
        const ov = await api<WebsiteOverview>(`/v1/website/overview?websiteId=${siteId}`)
        setOverview(ov)
      } catch {
        /* keep */
      }
    })()
  }, [siteId, demoMode])

  const site = useMemo(
    () => sites.find((s) => s.id === siteId) || overview?.site || null,
    [sites, siteId, overview],
  )

  const patchSiteLocal = useCallback((patch: Partial<WebsiteSite>) => {
    setSites((prev) => prev.map((s) => (s.id === siteId ? { ...s, ...patch } : s)))
    setOverview((ov) =>
      ov?.site && ov.site.id === siteId ? { ...ov, site: { ...ov.site, ...patch } } : ov,
    )
  }, [siteId])

  const value: SiteContextValue = {
    sites,
    site,
    overview,
    entitlements: overview?.entitlements || null,
    loading,
    demoMode,
    error,
    setActiveSiteId,
    refresh,
    patchSiteLocal,
  }

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>
}

export function useSite() {
  const ctx = useContext(SiteContext)
  if (!ctx) throw new Error('useSite must be used within SiteProvider')
  return ctx
}
