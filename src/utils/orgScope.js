/**
 * Helpers to stamp/filter records by active org scope.
 */

import { readOrgContext } from './orgStructureStore'

function hasEntitlement(entitlements, code) {
  if (!code) return true
  if (!Array.isArray(entitlements) || entitlements.length === 0) return false
  return entitlements.includes(code) || entitlements.includes('all')
}

/** Enterprise-only: explicit module flag required (no silent allow on empty entitlements). */
export function canUseMultiCompany(entitlements, planCode) {
  if (hasEntitlement(entitlements, 'multi_company')) return true
  if (Array.isArray(entitlements) && entitlements.length > 0) return false
  return String(planCode || '').toLowerCase() === 'enterprise'
}

export function canUseMultiBranch(entitlements, planCode) {
  if (!canUseMultiCompany(entitlements, planCode)) return false
  if (hasEntitlement(entitlements, 'multi_branch')) return true
  if (Array.isArray(entitlements) && entitlements.length > 0) return false
  return String(planCode || '').toLowerCase() === 'enterprise'
}

export function canUseMultiWarehouse(entitlements, planCode) {
  if (!canUseMultiCompany(entitlements, planCode)) return false
  if (hasEntitlement(entitlements, 'multi_warehouse') || hasEntitlement(entitlements, 'warehouse')) return true
  if (Array.isArray(entitlements) && entitlements.length > 0) return false
  return String(planCode || '').toLowerCase() === 'enterprise'
}

export function getActiveOrgScope() {
  return readOrgContext()
}

export function withOrgScope(record, scope = {}) {
  if (!record || typeof record !== 'object') return record
  return {
    ...record,
    companyId: scope.companyId ?? record.companyId ?? null,
    branchId: scope.branchId ?? record.branchId ?? null,
    warehouseId: scope.warehouseId ?? record.warehouseId ?? null,
  }
}

export function matchesOrgScope(record, scope = {}, { loose = true } = {}) {
  if (!record) return false
  if (!scope?.companyId) return true
  if (record.companyId && record.companyId !== scope.companyId) return false
  if (!loose && !record.companyId) return false
  if (scope.branchId && record.branchId && record.branchId !== scope.branchId) return false
  if (scope.warehouseId && record.warehouseId && record.warehouseId !== scope.warehouseId) return false
  return true
}

export function filterByOrgScope(list, scope, options) {
  if (!Array.isArray(list)) return []
  if (!scope?.companyId) return list
  return list.filter((item) => matchesOrgScope(item, scope, options))
}
