/**
 * Secure file upload → R2 (S3-compatible) when configured.
 */
import type { FastifyInstance } from 'fastify'
import { randomBytes } from 'node:crypto'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { z } from 'zod'
import { authenticate, requirePermission, requireTenant } from '../../shared/authGuard.js'
import { env } from '../../config/env.js'
import { logActivity } from '../audit/activityService.js'
import { AppError } from '../../shared/errors.js'

const MAX_BYTES = 8 * 1024 * 1024
const ALLOWED = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/pdf',
  'application/octet-stream',
])

function r2Configured() {
  return Boolean(env.R2_ENDPOINT && env.R2_ACCESS_KEY && env.R2_SECRET_KEY && env.R2_BUCKET)
}

function sanitizeName(name: string) {
  return String(name || 'file')
    .replace(/\\/g, '/')
    .split('/')
    .pop()!
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(0, 120)
}

function s3() {
  return new S3Client({
    region: 'auto',
    endpoint: env.R2_ENDPOINT,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY!,
      secretAccessKey: env.R2_SECRET_KEY!,
    },
  })
}

export async function uploadRoutes(app: FastifyInstance) {
  app.post(
    '/v1/files/upload',
    { preHandler: [authenticate, requirePermission('crm.customers.create')] },
    async (req) => {
      const companyId = requireTenant(req)
      const body = z
        .object({
          fileName: z.string().min(1).max(200),
          contentType: z.string().min(3).max(100),
          base64: z.string().min(1),
          folder: z.string().max(64).optional(),
        })
        .parse(req.body)

      if (!ALLOWED.has(body.contentType) && !body.contentType.startsWith('image/')) {
        throw new AppError('INVALID_FILE', 'Dosya türüne izin verilmiyor', 400)
      }

      const raw = Buffer.from(body.base64.replace(/^data:[^;]+;base64,/, ''), 'base64')
      if (raw.length > MAX_BYTES) {
        throw new AppError('FILE_TOO_LARGE', 'Dosya 8 MB sınırını aşıyor', 400)
      }

      const safe = sanitizeName(body.fileName)
      const key = `${companyId}/${body.folder || 'uploads'}/${Date.now()}-${randomBytes(6).toString('hex')}-${safe}`

      if (!r2Configured()) {
        if (env.NODE_ENV === 'production') {
          throw new AppError('STORAGE_NOT_CONFIGURED', 'R2 depolama yapılandırılmamış', 503)
        }
        const dataUrl = `data:${body.contentType};base64,${raw.toString('base64')}`
        await logActivity({
          companyId,
          userId: req.auth!.sub,
          action: 'file.upload.dev',
          resource: 'file',
          resourceId: key,
          meta: { bytes: raw.length, contentType: body.contentType },
        })
        return { ok: true, key, url: dataUrl, storage: 'dev-data-url', bytes: raw.length }
      }

      await s3().send(
        new PutObjectCommand({
          Bucket: env.R2_BUCKET,
          Key: key,
          Body: raw,
          ContentType: body.contentType,
        }),
      )

      const publicBase = env.R2_PUBLIC_BASE_URL || ''
      const url = publicBase ? `${publicBase.replace(/\/$/, '')}/${key}` : null

      await logActivity({
        companyId,
        userId: req.auth!.sub,
        action: 'file.upload',
        resource: 'file',
        resourceId: key,
        meta: { bytes: raw.length, contentType: body.contentType },
      })

      return { ok: true, key, url, storage: 'r2', bytes: raw.length }
    },
  )
}
