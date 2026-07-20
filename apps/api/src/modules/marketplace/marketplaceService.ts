import { AppError } from '../../shared/errors.js'
import {
  MARKETPLACE_ITEMS,
  getMarketplaceCatalog,
  recommendMarketplaceItems,
} from './marketplaceCatalog.js'

type InstallRow = {
  id: string
  companyId: string
  itemId: string
  slug: string
  title: string
  version: string
  status: 'installed' | 'update_available' | 'disabled'
  securityScan: 'passed' | 'pending'
  installedAt: string
  license: string
}

const installsByCompany = new Map<string, InstallRow[]>()

function uid() {
  return `mpi_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`
}

export function marketplaceOverview(companyId: string) {
  const installed = installsByCompany.get(companyId) || []
  const catalog = getMarketplaceCatalog()
  return {
    version: 'MP-0',
    featured: MARKETPLACE_ITEMS.filter((i) => i.featured).slice(0, 6),
    trending: MARKETPLACE_ITEMS.filter((i) => i.trending).slice(0, 6),
    installedCount: installed.length,
    updatesAvailable: installed.filter((i) => i.status === 'update_available').length,
    catalogCounts: catalog.counts,
  }
}

export function marketplaceCatalog() {
  return getMarketplaceCatalog()
}

export function listInstalled(companyId: string) {
  return installsByCompany.get(companyId) || []
}

export function installMarketplaceItem(companyId: string, itemId: string) {
  const item = MARKETPLACE_ITEMS.find((i) => i.id === itemId || i.slug === itemId)
  if (!item) throw new AppError('NOT_FOUND', 'Paket bulunamadı', 404)
  const list = installsByCompany.get(companyId) || []
  if (list.some((x) => x.itemId === item.id)) {
    throw new AppError('CONFLICT', 'Paket zaten kurulu', 409)
  }
  const row: InstallRow = {
    id: uid(),
    companyId,
    itemId: item.id,
    slug: item.slug,
    title: item.title,
    version: item.version,
    status: 'installed',
    securityScan: 'passed',
    installedAt: new Date().toISOString(),
    license: item.license,
  }
  installsByCompany.set(companyId, [row, ...list])
  return {
    install: row,
    plugin: {
      code: `plugin.${item.slug}`,
      channel: 'platform_plugins',
      isolated: true,
      note: 'MP-0 stub — Plugin SDK kaydı; çekirdek tablolara yazılmaz.',
    },
  }
}

export function uninstallMarketplaceItem(companyId: string, itemId: string) {
  const list = installsByCompany.get(companyId) || []
  const next = list.filter((x) => x.itemId !== itemId && x.slug !== itemId)
  if (next.length === list.length) throw new AppError('NOT_FOUND', 'Kurulum bulunamadı', 404)
  installsByCompany.set(companyId, next)
  return { itemId }
}

export function marketplaceRecommend(hints: string[] = []) {
  return {
    rows: recommendMarketplaceItems(hints),
    explainWhy:
      'Eksik kapasite / trend / etiket eşleşmesi ile önerildi (MP-0 heuristic; AIOS gateway later).',
  }
}
