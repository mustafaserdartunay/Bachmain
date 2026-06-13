import { findCustomerProfileByReference } from '../data/customerProfiles'
import { resolvePrimaryContact } from './customerContacts'
import { getCrmTemplateStage } from './crmProcessStages'
import { buildCrmProcessNotifyMessage } from './crmWhatsAppNotify'

export function resolveCustomerEmail(record) {
  const profile = findCustomerProfileByReference(record?.customer)
  const primary = resolvePrimaryContact(profile?.contacts || [], profile || {})
  const candidates = [
    record?.email,
    record?.contactEmail,
    primary.email,
    profile?.email,
  ]
  for (const candidate of candidates) {
    const email = String(candidate || '').trim()
    if (email.includes('@')) return email
  }
  return ''
}

export function openCrmProcessEmail({ record, stage, template, kind = 'appointment' }) {
  const resolvedStage = stage?.whatsappKey ? stage : getCrmTemplateStage(template, stage?.id || stage)
  if (!resolvedStage) return { ok: false, reason: 'Aşama bulunamadı.' }

  const email = resolveCustomerEmail(record)
  const title = record?.title || template?.label || 'Süreç'
  const subject = encodeURIComponent(`${title} — ${resolvedStage.label} güncellemesi`)
  const body = encodeURIComponent(buildCrmProcessNotifyMessage({ record, stage: resolvedStage, template, kind }))
  window.location.href = `mailto:${email}?subject=${subject}&body=${body}`

  return { ok: true, email: email || null }
}
