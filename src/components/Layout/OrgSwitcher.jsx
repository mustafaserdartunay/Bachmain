import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Building2,
  Check,
  ChevronRight,
  Eye,
  Loader2,
  MapPin,
  Pencil,
  Warehouse,
} from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import { useOrg } from '../../org/OrgContext'
import { HEADER_CONTROL_BUTTON_CLASS } from '../../utils/themeMode'

export default function OrgSwitcher() {
  const { user, listAccessibleCompanies, switchCompany } = useAuth()
  const {
    multiBranch,
    multiWarehouse,
    companies: localCompanies,
    branches,
    warehouses,
    activeBranch,
    activeWarehouse,
    setBranch,
    setWarehouse,
  } = useOrg()
  const anchorRef = useRef(null)
  const menuRef = useRef(null)
  const closeTimerRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [style, setStyle] = useState(null)
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(false)
  const [switchingTenantCode, setSwitchingTenantCode] = useState('')
  const [error, setError] = useState('')

  const cancelClose = useCallback(() => {
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current)
  }, [])

  const closeSoon = useCallback(() => {
    cancelClose()
    closeTimerRef.current = window.setTimeout(() => setOpen(false), 160)
  }, [cancelClose])

  const loadCompanies = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const result = await listAccessibleCompanies()
      setCompanies(result.companies)
    } catch (requestError) {
      if (user?.id === 'local-dev') {
        setCompanies(
          localCompanies.map((company) => ({
            ...company,
            tenantCode: user.tenantCode,
            accessLevel: 'owner',
            primary: true,
          })),
        )
        return
      }
      setError(requestError.message || 'Firma listesi alınamadı')
    } finally {
      setLoading(false)
    }
  }, [listAccessibleCompanies, localCompanies, user?.id, user?.tenantCode])

  useEffect(() => {
    if (!open || !anchorRef.current) return undefined
    loadCompanies()
    function place() {
      const rect = anchorRef.current.getBoundingClientRect()
      setStyle({
        position: 'fixed',
        top: rect.bottom + 8,
        left: Math.min(rect.left, window.innerWidth - 336),
        width: 320,
        zIndex: 10000,
      })
    }
    function onDocumentPointer(event) {
      if (menuRef.current?.contains(event.target) || anchorRef.current?.contains(event.target))
        return
      setOpen(false)
    }
    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    document.addEventListener('mousedown', onDocumentPointer)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
      document.removeEventListener('mousedown', onDocumentPointer)
    }
  }, [loadCompanies, open])

  useEffect(
    () => () => {
      cancelClose()
    },
    [cancelClose],
  )

  async function handleCompanySwitch(tenantCode) {
    if (!tenantCode || tenantCode === user?.tenantCode) {
      setOpen(false)
      return
    }
    setSwitchingTenantCode(tenantCode)
    setError('')
    try {
      await switchCompany(tenantCode)
      window.location.reload()
    } catch (requestError) {
      setError(requestError.message || 'Firma değiştirilemedi')
      setSwitchingTenantCode('')
    }
  }

  const activeCompany = companies.find((company) => company.tenantCode === user?.tenantCode)
  const accessLevel = activeCompany?.accessLevel || user?.accessLevel || user?.role
  const readOnly = accessLevel === 'viewer'

  return (
    <div
      ref={anchorRef}
      className="relative"
      onMouseEnter={() => {
        cancelClose()
        setOpen(true)
      }}
      onMouseLeave={closeSoon}
    >
      <button
        type="button"
        className={`${HEADER_CONTROL_BUTTON_CLASS} icon-only`}
        onClick={() => setOpen((value) => !value)}
        aria-label="Firma, şube ve depo seçimi"
        aria-expanded={open}
        title="Firma, şube ve depo seçimi"
      >
        <span className="icon-wrap">
          <Building2 className="h-4 w-4 shrink-0" />
        </span>
      </button>

      {open
        ? createPortal(
            <div
              ref={menuRef}
              style={style || { visibility: 'hidden' }}
              className="app-header-dropdown overflow-hidden"
              onMouseEnter={cancelClose}
              onMouseLeave={closeSoon}
            >
              <div className="flex items-center gap-3 border-b border-[rgba(140,145,165,0.14)] p-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 ring-1 ring-blue-500/20">
                  <Building2 className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-[var(--ink)]">
                    {activeCompany?.name || user?.companyName || 'Firma Seçimi'}
                  </p>
                  <p
                    className={`mt-0.5 flex items-center gap-1 text-[10px] font-semibold ${
                      readOnly ? 'text-amber-600' : 'text-emerald-600'
                    }`}
                  >
                    {readOnly ? <Eye className="h-3 w-3" /> : <Pencil className="h-3 w-3" />}
                    {readOnly ? 'Sadece görüntüleme' : 'Görüntüleme ve düzenleme'}
                  </p>
                </div>
              </div>

              <div className="max-h-[26rem] overflow-y-auto p-2">
                <p className="px-2 pb-1 pt-1 text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">
                  Firmalar
                </p>
                {loading ? (
                  <div className="flex items-center gap-2 px-3 py-3 text-xs text-[var(--muted)]">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Firmalar yükleniyor
                  </div>
                ) : null}
                {!loading
                  ? companies.map((company) => {
                      const selected = company.tenantCode === user?.tenantCode
                      const switching = switchingTenantCode === company.tenantCode
                      return (
                        <button
                          key={company.tenantCode}
                          type="button"
                          disabled={Boolean(switchingTenantCode)}
                          onClick={() => handleCompanySwitch(company.tenantCode)}
                          className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left transition-colors ${
                            selected
                              ? 'bg-blue-500/15 text-blue-600'
                              : 'text-[var(--ink)] hover:bg-white/55'
                          }`}
                        >
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-xs font-bold">{company.name}</span>
                            <span className="block text-[10px] font-semibold text-[var(--muted)]">
                              {company.accessLevel === 'viewer'
                                ? 'Sadece görüntüleme'
                                : 'Görüntüleme ve düzenleme'}
                            </span>
                          </span>
                          {switching ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : selected ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-[var(--muted)]" />
                          )}
                        </button>
                      )
                    })
                  : null}

                {multiBranch ? (
                  <>
                    <p className="px-2 pb-1 pt-3 text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">
                      Şubeler
                    </p>
                    {branches.map((branch) => (
                      <button
                        key={branch.id}
                        type="button"
                        onClick={() => {
                          setBranch(branch.id)
                          setOpen(false)
                        }}
                        className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-semibold ${
                          branch.id === activeBranch?.id
                            ? 'bg-blue-500/10 text-blue-600'
                            : 'text-[var(--ink)] hover:bg-white/55'
                        }`}
                      >
                        <MapPin className="h-3.5 w-3.5" />
                        <span className="truncate">{branch.name}</span>
                        {branch.id === activeBranch?.id ? (
                          <Check className="ml-auto h-3.5 w-3.5" />
                        ) : null}
                      </button>
                    ))}
                  </>
                ) : null}

                {multiWarehouse ? (
                  <>
                    <p className="px-2 pb-1 pt-3 text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">
                      Depolar
                    </p>
                    {warehouses.map((warehouse) => (
                      <button
                        key={warehouse.id}
                        type="button"
                        onClick={() => {
                          setWarehouse(warehouse.id)
                          setOpen(false)
                        }}
                        className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-semibold ${
                          warehouse.id === activeWarehouse?.id
                            ? 'bg-blue-500/10 text-blue-600'
                            : 'text-[var(--ink)] hover:bg-white/55'
                        }`}
                      >
                        <Warehouse className="h-3.5 w-3.5" />
                        <span className="truncate">{warehouse.name}</span>
                        {warehouse.id === activeWarehouse?.id ? (
                          <Check className="ml-auto h-3.5 w-3.5" />
                        ) : null}
                      </button>
                    ))}
                  </>
                ) : null}
                {error ? (
                  <p className="px-3 py-2 text-xs font-semibold text-rose-600">{error}</p>
                ) : null}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}
