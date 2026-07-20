import { AppError } from '../../shared/errors.js'
import {
  CONNECTOR_CATALOG,
  getIntegrationCatalog,
  recommendConnectors,
} from './integrationCatalog.js'

type ConnectionRow = {
  id: string
  companyId: string
  connectorId: string
  slug: string
  title: string
  protocol: string
  status: 'connected' | 'error' | 'disabled'
  health: 'ok' | 'degraded' | 'down'
  lastSyncAt: string | null
  connectedAt: string
}

type WebhookRow = {
  id: string
  direction: 'incoming' | 'outgoing'
  url: string
  status: 'active' | 'paused' | 'failed'
  signature: boolean
}

type RetryRow = {
  id: string
  connectorSlug: string
  error: string
  attempts: number
  nextRetryAt: string
}

const connectionsByCompany = new Map<string, ConnectionRow[]>()
const webhooksSeed: WebhookRow[] = [
  {
    id: 'wh_in_1',
    direction: 'incoming',
    url: '/v1/webhooks/inbound/{tenant}',
    status: 'active',
    signature: true,
  },
  {
    id: 'wh_out_1',
    direction: 'outgoing',
    url: 'https://partner.example/hooks/bach',
    status: 'paused',
    signature: true,
  },
]
const retriesSeed: RetryRow[] = [
  {
    id: 'rt_1',
    connectorSlug: 'shopify',
    error: '429 rate limit',
    attempts: 2,
    nextRetryAt: new Date(Date.now() + 60_000).toISOString(),
  },
]

function uid() {
  return `ic_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`
}

export function integrationOverview(companyId: string) {
  const connections = connectionsByCompany.get(companyId) || []
  const catalog = getIntegrationCatalog()
  return {
    version: 'IH-0',
    connectors: catalog.items.length,
    connected: connections.filter((c) => c.status === 'connected').length,
    webhooks: webhooksSeed.length,
    retries: retriesSeed.length,
    protocols: catalog.protocols.length,
    healthOk: connections.filter((c) => c.health === 'ok').length,
    featured: CONNECTOR_CATALOG.filter((c) => c.featured).slice(0, 6),
  }
}

export function integrationCatalog() {
  return getIntegrationCatalog()
}

export function listConnections(companyId: string) {
  return connectionsByCompany.get(companyId) || []
}

export function listWebhooks() {
  return webhooksSeed
}

export function listRetries() {
  return retriesSeed
}

export function connectIntegration(companyId: string, connectorId: string) {
  const item = CONNECTOR_CATALOG.find((c) => c.id === connectorId || c.slug === connectorId)
  if (!item) throw new AppError('NOT_FOUND', 'Bağlantı bulunamadı', 404)
  if (item.status === 'coming') {
    throw new AppError('UNAVAILABLE', 'Bağlantı yakında (IH-1/2)', 400)
  }
  const list = connectionsByCompany.get(companyId) || []
  if (list.some((x) => x.connectorId === item.id)) {
    throw new AppError('CONFLICT', 'Zaten bağlı', 409)
  }
  const row: ConnectionRow = {
    id: uid(),
    companyId,
    connectorId: item.id,
    slug: item.slug,
    title: item.title,
    protocol: item.protocol,
    status: 'connected',
    health: 'ok',
    lastSyncAt: new Date().toISOString(),
    connectedAt: new Date().toISOString(),
  }
  connectionsByCompany.set(companyId, [row, ...list])
  return {
    connection: row,
    note: 'IH-0 stub — OAuth/secrets IH-1; event-driven sync via workflow bus.',
  }
}

export function disconnectIntegration(companyId: string, connectorId: string) {
  const list = connectionsByCompany.get(companyId) || []
  const next = list.filter((x) => x.connectorId !== connectorId && x.slug !== connectorId)
  if (next.length === list.length) throw new AppError('NOT_FOUND', 'Bağlantı yok', 404)
  connectionsByCompany.set(companyId, next)
  return { connectorId }
}

export function runIntegrationWizard(brief: string) {
  const hints = brief
    .toLowerCase()
    .split(/[\s,.;:]+/)
    .filter((w) => w.length > 2)
  const suggested = recommendConnectors(hints)
  const primary = suggested[0]
  return {
    brief,
    suggested,
    draftFlow: {
      name: primary ? `${primary.title} sync` : 'Custom integration',
      steps: [
        { type: 'trigger', label: 'Schedule / Event' },
        { type: 'api_call', label: primary ? `Call ${primary.title}` : 'API Call' },
        { type: 'transform', label: 'Field mapping' },
        { type: 'decision', label: 'Validate' },
        { type: 'end', label: 'Commit / Notify' },
      ],
      deepLink: '/otomasyon/designer',
    },
    explainWhy:
      'NL brief → connector heuristic + draft workflow (IH-0). AIOS gateway mapping IH-1.',
  }
}
