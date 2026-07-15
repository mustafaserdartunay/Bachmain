import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { readCompanySettings, updateCompanySettings } from '../utils/companySettings'
import {
  ORG_CONTEXT_EVENT,
  ORG_EVENT,
  appendOrgLog,
  ensureDefaultCompanyFromSettings,
  readOrgContext,
  readOrgStructure,
  resolveActiveOrg,
  saveOrgStructure,
  writeOrgContext,
} from '../utils/orgStructureStore'
import { canUseMultiBranch, canUseMultiCompany, canUseMultiWarehouse } from '../utils/orgScope'

const OrgContext = createContext(null)

export function OrgProvider({ children }) {
  const { user } = useAuth()
  const entitlements = user?.entitlements
  const planCode = user?.planCode
  const multiCompany = canUseMultiCompany(entitlements, planCode)
  const multiBranch = canUseMultiBranch(entitlements, planCode)
  const multiWarehouse = canUseMultiWarehouse(entitlements, planCode)

  const [structure, setStructure] = useState(() => readOrgStructure())
  const [context, setContext] = useState(() => readOrgContext())
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!user?.limits) return
    saveOrgStructure((s) => ({
      ...s,
      limits: {
        maxCompanies: user.limits.maxCompanies ?? s.limits?.maxCompanies ?? 0,
        maxBranches: user.limits.maxBranches ?? s.limits?.maxBranches ?? 0,
        maxWarehouses: user.limits.maxWarehouses ?? s.limits?.maxWarehouses ?? 0,
      },
    }))
  }, [user?.limits?.maxCompanies, user?.limits?.maxBranches, user?.limits?.maxWarehouses])

  useEffect(() => {
    if (!multiCompany) return
    const next = ensureDefaultCompanyFromSettings(readCompanySettings())
    setStructure(next)
    const resolved = resolveActiveOrg(next, readOrgContext())
    if (resolved.company && (!context.companyId || context.companyId !== resolved.company.id)) {
      const patch = {
        companyId: resolved.company.id,
        branchId: resolved.branch?.id || null,
        warehouseId: resolved.warehouse?.id || null,
      }
      setContext(writeOrgContext(patch))
    }
  }, [multiCompany, user?.tenantCode])

  useEffect(() => {
    function refresh() {
      setStructure(readOrgStructure())
      setContext(readOrgContext())
      setTick((t) => t + 1)
    }
    window.addEventListener(ORG_EVENT, refresh)
    window.addEventListener(ORG_CONTEXT_EVENT, refresh)
    return () => {
      window.removeEventListener(ORG_EVENT, refresh)
      window.removeEventListener(ORG_CONTEXT_EVENT, refresh)
    }
  }, [])

  const active = useMemo(() => resolveActiveOrg(structure, context), [structure, context, tick])

  const scope = useMemo(
    () => ({
      companyId: active.company?.id || null,
      branchId: active.branch?.id || null,
      warehouseId: active.warehouse?.id || null,
    }),
    [active.company?.id, active.branch?.id, active.warehouse?.id],
  )

  const setCompany = useCallback(
    (companyId) => {
      if (!multiCompany) return
      const nextStruct = readOrgStructure()
      const company = nextStruct.companies.find((c) => c.id === companyId)
      const branches = nextStruct.branches.filter((b) => b.companyId === companyId && b.active !== false)
      const branch = branches[0] || null
      const warehouses = nextStruct.warehouses.filter(
        (w) => w.companyId === companyId && (!branch || w.branchId === branch.id) && w.active !== false,
      )
      const warehouse = warehouses.find((w) => w.id === branch?.defaultWarehouseId) || warehouses[0] || null
      const next = writeOrgContext({
        companyId: company?.id || null,
        branchId: branch?.id || null,
        warehouseId: warehouse?.id || null,
      })
      setContext(next)
      appendOrgLog('company_switched', { companyId: company?.id, name: company?.name })
      if (company?.name) {
        updateCompanySettings({
          companyName: company.legalName || company.name,
          phone: company.phone || undefined,
          email: company.email || undefined,
          address: company.address || undefined,
          taxNo: company.taxNo || undefined,
          taxOffice: company.taxOffice || undefined,
        })
      }
      window.dispatchEvent(new CustomEvent('bachmain:org-scope-changed', { detail: next }))
      window.dispatchEvent(new CustomEvent('bach:customers-updated'))
      window.dispatchEvent(new CustomEvent('erlenbox:treasury-updated'))
    },
    [multiCompany],
  )

  const setBranch = useCallback(
    (branchId) => {
      if (!multiBranch) return
      const nextStruct = readOrgStructure()
      const branch = nextStruct.branches.find((b) => b.id === branchId)
      const warehouses = nextStruct.warehouses.filter(
        (w) => w.branchId === branchId && w.active !== false,
      )
      const warehouse = warehouses.find((w) => w.id === branch?.defaultWarehouseId) || warehouses[0] || null
      const next = writeOrgContext({
        companyId: branch?.companyId || context.companyId,
        branchId: branch?.id || null,
        warehouseId: warehouse?.id || null,
      })
      setContext(next)
      appendOrgLog('branch_switched', { branchId: branch?.id, name: branch?.name })
      window.dispatchEvent(new CustomEvent('bachmain:org-scope-changed', { detail: next }))
      window.dispatchEvent(new CustomEvent('bach:customers-updated'))
      window.dispatchEvent(new CustomEvent('erlenbox:treasury-updated'))
    },
    [multiBranch, context.companyId],
  )

  const setWarehouse = useCallback(
    (warehouseId) => {
      if (!multiWarehouse) return
      const nextStruct = readOrgStructure()
      const warehouse = nextStruct.warehouses.find((w) => w.id === warehouseId)
      const next = writeOrgContext({
        companyId: warehouse?.companyId || context.companyId,
        branchId: warehouse?.branchId || context.branchId,
        warehouseId: warehouse?.id || null,
      })
      setContext(next)
      appendOrgLog('warehouse_switched', { warehouseId: warehouse?.id, name: warehouse?.name })
      window.dispatchEvent(new CustomEvent('bachmain:org-scope-changed', { detail: next }))
      window.dispatchEvent(new CustomEvent('bach:customers-updated'))
      window.dispatchEvent(new CustomEvent('erlenbox:treasury-updated'))
    },
    [multiWarehouse, context.companyId, context.branchId],
  )

  const refreshStructure = useCallback(() => {
    setStructure(readOrgStructure())
    setTick((t) => t + 1)
  }, [])

  const value = useMemo(
    () => ({
      enabled: multiCompany,
      multiCompany,
      multiBranch,
      multiWarehouse,
      structure,
      context,
      scope,
      activeCompany: active.company,
      activeBranch: active.branch,
      activeWarehouse: active.warehouse,
      companies: active.companies,
      branches: active.branches,
      warehouses: active.warehouses,
      setCompany,
      setBranch,
      setWarehouse,
      refreshStructure,
    }),
    [
      multiCompany,
      multiBranch,
      multiWarehouse,
      structure,
      context,
      scope,
      active,
      setCompany,
      setBranch,
      setWarehouse,
      refreshStructure,
    ],
  )

  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>
}

export function useOrg() {
  const ctx = useContext(OrgContext)
  if (!ctx) {
    return {
      enabled: false,
      multiCompany: false,
      multiBranch: false,
      multiWarehouse: false,
      structure: readOrgStructure(),
      scope: { companyId: null, branchId: null, warehouseId: null },
      companies: [],
      branches: [],
      warehouses: [],
      setCompany: () => {},
      setBranch: () => {},
      setWarehouse: () => {},
      refreshStructure: () => {},
    }
  }
  return ctx
}
