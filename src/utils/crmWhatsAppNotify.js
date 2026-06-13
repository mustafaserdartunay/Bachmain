import { findCustomerProfileByReference } from '../data/customerProfiles'
import { getCustomerDisplay } from './customerDisplay'
import { resolvePrimaryContact } from './customerContacts'
import { getCrmTemplateStage } from './crmProcessStages'

/** CRM süreç bildirimleri — üretim için benzer util ayrı eklenebilir. UI: WhatsAppNotifyButton */

export function normalizePhoneForWhatsApp(phone) {
  const digits = String(phone || '').replace(/\D/g, '')
  if (!digits) return ''
  if (digits.startsWith('90') && digits.length >= 12) return digits
  if (digits.startsWith('0') && digits.length === 11) return `90${digits.slice(1)}`
  if (digits.length === 10) return `90${digits}`
  return digits
}

export function resolveCustomerWhatsAppPhone(record) {
  const profile = findCustomerProfileByReference(record?.customer)
  const primary = resolvePrimaryContact(profile?.contacts || [], profile || {})
  const candidates = [
    record?.contactPhone,
    primary.phone,
    profile?.phone,
  ]
  for (const candidate of candidates) {
    const normalized = normalizePhoneForWhatsApp(candidate)
    if (normalized) return normalized
  }
  return ''
}

function formatScheduleLabel(record) {
  const date = record?.date || record?.dueDate || ''
  const time = record?.startTime || record?.time || ''
  if (!date) return ''
  const formatted = new Date(`${date}T12:00:00`).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
  })
  return time ? `${formatted} · ${time}` : formatted
}

export function buildCrmProcessNotifyMessage({ record, stage, template, kind }) {
  return buildMessageBody({ record, stage, template, kind })
}

function buildMessageBody({ record, stage, template, kind }) {
  const customer = getCustomerDisplay(record?.customer).brandShortName || 'değerli müşterimiz'
  const contact = record?.contact || customer
  const title = record?.title || template?.label || 'süreciniz'
  const schedule = formatScheduleLabel(record)
  const completedAt = record?.processTrack?.stageHistory?.[stage.id]?.reachedAt || ''

  const messages = {
    waiting: `Merhaba ${contact}, ${title} süreciniz beklemede. En kısa sürede sizi bilgilendireceğiz. — Erlenbox`,
    planned: schedule
      ? `Merhaba ${contact}, ${title} süreciniz ${schedule} tarihinde başlayacaktır. — Erlenbox`
      : `Merhaba ${contact}, ${title} için planlama yapıldı. Tarih netleşince tekrar bilgilendireceğiz. — Erlenbox`,
    preparing: `Merhaba ${contact}, ${title} teklifiniz hazırlanıyor. Tamamlandığında paylaşacağız. — Erlenbox`,
    presented: `Merhaba ${contact}, ${title} teklif sunumunuz tamamlandı. Değerlendirmenizi bekliyoruz. — Erlenbox`,
    started: `Merhaba ${contact}, ${title} süreciniz başlamıştır. İlerlemeyi sizinle paylaşmaya devam edeceğiz. — Erlenbox`,
    ready: completedAt
      ? `Merhaba ${contact}, ${title} süreciniz tamamlandı (${completedAt}). Detaylar için bize ulaşabilirsiniz. — Erlenbox`
      : `Merhaba ${contact}, ${title} süreciniz tamamlandı ve hazır. Detaylar için bize ulaşabilirsiniz. — Erlenbox`,
  }

  const key = stage?.whatsappKey || 'waiting'
  return messages[key] || `Merhaba ${contact}, ${title} sürecinizle ilgili güncelleme: ${stage?.label || 'bilgilendirme'}. — Erlenbox`
}

export function openCrmProcessWhatsApp({ record, stage, template, kind = 'appointment' }) {
  const resolvedStage = stage?.whatsappKey ? stage : getCrmTemplateStage(template, stage?.id || stage)
  if (!resolvedStage) return { ok: false, reason: 'Aşama bulunamadı.' }

  const phone = resolveCustomerWhatsAppPhone(record)
  const text = encodeURIComponent(buildMessageBody({ record, stage: resolvedStage, template, kind }))
  const url = phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`

  window.open(url, '_blank', 'noopener,noreferrer')
  return { ok: true, phone: phone || null }
}
