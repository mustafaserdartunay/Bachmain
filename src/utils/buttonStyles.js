/**
 * Legacy class tokens — prefer `import { Button } from '@bachmain/ui'`.
 * Heights match header quick-actions (52px via --ds-control-h).
 */

/** Yeni oluştur / birincil CTA — Kasa sky→blue gradient */
export const BTN_PRIMARY =
  'btn-primary inline-flex h-control min-h-control items-center justify-center rounded-xl font-extrabold uppercase tracking-wide transition-transform'

/** Vazgeç / iptal — Yeni Alış Faturası rose gradient */
export const BTN_CANCEL =
  'btn-cancel inline-flex h-control min-h-control items-center justify-center rounded-xl font-extrabold uppercase tracking-wide transition-transform'

/** Olumlu — kaydet, onay, WhatsApp, başarı aksiyonları */
export const BTN_SUCCESS =
  'btn-success inline-flex h-control min-h-control items-center justify-center rounded-xl font-extrabold uppercase tracking-wide transition-transform'

/** Üretim sayfası artı (+) butonu — info ton */
export const URETIM_ARTI_BUTTON_CLASS =
  'border border-[color-mix(in_srgb,var(--ds-info)_35%,transparent)] bg-[color-mix(in_srgb,var(--ds-info)_10%,transparent)] text-ds-info transition-colors hover:bg-[color-mix(in_srgb,var(--ds-info)_16%,transparent)]'

/** Düzenleme kalemi — üretim artı butonu ile aynı mavi ton */
export const DUZENLEME_KALEMI_BUTTON_CLASS = `${URETIM_ARTI_BUTTON_CLASS} p-2`

/** Teklifler sayfası çöp kutusu — danger ton */
export const TEKLIFLER_COP_KUTUSU_BUTTON_CLASS =
  'border border-[color-mix(in_srgb,var(--ds-danger)_35%,transparent)] bg-[color-mix(in_srgb,var(--ds-danger)_10%,transparent)] p-2 text-ds-danger transition-colors hover:bg-[color-mix(in_srgb,var(--ds-danger)_16%,transparent)]'

/** WhatsApp bildirim */
export const WHATSAPP_BILDIRIM_BUTTON_CLASS =
  'border border-green-500/25 bg-green-500/10 text-[#25D366] transition-colors hover:border-green-500/35 hover:bg-green-500/15 hover:text-[#20bd5a] p-2'

export const WHATSAPP_BILDIRIM_SENT_BUTTON_CLASS =
  'border border-cyan-500/25 bg-cyan-500/10 text-cyan-400 transition-colors hover:border-cyan-500/35 hover:bg-cyan-500/15 hover:text-cyan-300 p-2'

export const MAIL_BILDIRIM_BUTTON_CLASS =
  'border border-indigo-500/25 bg-indigo-500/10 text-indigo-400 transition-colors hover:border-indigo-500/35 hover:bg-indigo-500/15 hover:text-indigo-300 p-2'

export const MAIL_BILDIRIM_SENT_BUTTON_CLASS =
  'border border-cyan-500/25 bg-cyan-500/10 text-cyan-400 transition-colors hover:border-cyan-500/35 hover:bg-cyan-500/15 hover:text-cyan-300 p-2'
