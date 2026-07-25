/**
 * /api/mail/* — staff mail ops (auth transactional mail lives in authRoutes).
 */
import { getStaffSession } from './staffAuth.mjs'
import { loadStore, withStore } from './store.mjs'
import { sendJson } from './authRoutes.mjs'
import {
  getMailStatus,
  listMailLogs,
  listMailQueue,
  listMailTemplates,
  processMailQueue,
  resendMail,
  sendTemplateMail,
  updateMailSettings,
} from './mail/mailService.mjs'

function assertStaff(req, res) {
  const session = getStaffSession(req)
  if (!session && process.env.STAFF_AUTH_REQUIRED !== '0') {
    sendJson(req, res, 401, {
      ok: false,
      error: 'UNAUTHORIZED',
      message: 'Personel oturumu gerekli',
    })
    return false
  }
  return true
}

export async function handleMailApi(req, res, path, body = {}) {
  const method = req.method
  if (!path.startsWith('mail')) return false
  if (!assertStaff(req, res)) return true

  if (method === 'GET' && path === 'mail/status') {
    const store = await loadStore()
    return sendJson(req, res, 200, { ok: true, ...getMailStatus(store) })
  }

  if (method === 'GET' && path === 'mail/templates') {
    return sendJson(req, res, 200, { ok: true, templates: listMailTemplates() })
  }

  if (method === 'GET' && path === 'mail/logs') {
    const store = await loadStore()
    const url = new URL(req.url, 'http://localhost')
    const status = url.searchParams.get('status') || undefined
    const template = url.searchParams.get('template') || undefined
    const limit = Number(url.searchParams.get('limit') || 100)
    return sendJson(req, res, 200, {
      ok: true,
      rows: listMailLogs(store, { status, template, limit }),
    })
  }

  if (method === 'GET' && path === 'mail/queue') {
    const store = await loadStore()
    return sendJson(req, res, 200, { ok: true, rows: listMailQueue(store) })
  }

  if (method === 'GET' && path === 'mail/failed') {
    const store = await loadStore()
    return sendJson(req, res, 200, {
      ok: true,
      rows: listMailLogs(store, { status: 'failed', limit: 200 }),
    })
  }

  if (method === 'POST' && path === 'mail/process-queue') {
    const result = await withStore((store) =>
      processMailQueue(store, { limit: Number(body.limit) || 25 }),
    )
    return sendJson(req, res, 200, { ok: true, ...result })
  }

  if (method === 'POST' && path.startsWith('mail/resend/')) {
    const id = path.split('/')[2]
    try {
      const row = await withStore((store) => resendMail(store, id))
      return sendJson(req, res, 200, { ok: true, row })
    } catch (error) {
      return sendJson(req, res, error.code === 'NOT_FOUND' ? 404 : 400, {
        ok: false,
        error: error.code || 'RESEND_FAILED',
        message: error.message,
      })
    }
  }

  if (method === 'GET' && path === 'mail/settings') {
    const store = await loadStore()
    const status = getMailStatus(store)
    return sendJson(req, res, 200, {
      ok: true,
      settings: store.mail?.settings || {},
      status,
      dnsHint: {
        spf: 'v=spf1 include:_spf.resend.com ~all',
        dmarc: 'v=DMARC1; p=none; rua=mailto:dmarc@bachmain.com',
        note: 'Resend dashboard → Domains → bachmain.com — exact DKIM/SPF values',
      },
    })
  }

  if (method === 'PATCH' && path === 'mail/settings') {
    const settings = await withStore((store) => updateMailSettings(store, body))
    return sendJson(req, res, 200, { ok: true, settings })
  }

  if (method === 'POST' && path === 'mail/test') {
    const to = String(body.to || body.email || '').trim()
    if (!to.includes('@')) {
      return sendJson(req, res, 400, {
        ok: false,
        error: 'INVALID_TO',
        message: 'Geçerli e-posta girin',
      })
    }
    const row = await withStore((store) =>
      sendTemplateMail(store, {
        to,
        template: body.template || 'test',
        type: 'api_test',
        data: { env: process.env.VERCEL_ENV || process.env.NODE_ENV || 'production' },
        immediate: true,
        meta: { source: 'admin_mail_test' },
      }),
    )
    return sendJson(req, res, 200, { ok: true, row })
  }

  if (method === 'POST' && path === 'mail/send') {
    const to = String(body.to || '').trim()
    if (!to.includes('@') || !body.template) {
      return sendJson(req, res, 400, {
        ok: false,
        error: 'INVALID_PAYLOAD',
        message: 'to ve template zorunlu',
      })
    }
    const row = await withStore((store) =>
      sendTemplateMail(store, {
        to,
        template: body.template,
        data: body.data || {},
        type: body.type || body.template,
        customerId: body.customerId,
        immediate: body.immediate !== false,
        meta: body.meta || {},
      }),
    )
    return sendJson(req, res, 200, { ok: true, row })
  }

  return false
}
