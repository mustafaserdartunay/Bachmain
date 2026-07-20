import { db } from '../../db/client.js'
import { activityLogs } from '../../db/schema/index.js'
import { AppError } from '../../shared/errors.js'

/** Append-only: activity / audit rows must never be deleted via API. */
export function rejectAuditMutation() {
  throw new AppError('AUDIT_IMMUTABLE', 'Audit log append-only; silme desteklenmez', 405)
}

export async function logActivity(input: {
  companyId?: string | null
  userId?: string | null
  action: string
  resource?: string
  resourceId?: string
  ip?: string
  userAgent?: string
  device?: string
  meta?: Record<string, unknown>
}) {
  await db.insert(activityLogs).values({
    companyId: input.companyId || null,
    userId: input.userId || null,
    action: input.action,
    resource: input.resource || null,
    resourceId: input.resourceId || null,
    ip: input.ip || null,
    userAgent: input.userAgent || null,
    device: input.device || null,
    meta: input.meta || {},
  })
}
