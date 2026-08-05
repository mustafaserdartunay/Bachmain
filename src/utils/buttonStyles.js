/**
 * Legacy class tokens — prefer `import { Button } from '@bachmain/ui'`.
 * Heights match header quick-actions (52px via --ds-control-h).
 * Label casing matches header chips (e.g. “Gelir Ekle”) — sentence case, not ALL CAPS.
 */

/** Yeni oluştur / birincil CTA — Kasa sky→blue gradient */
export const BTN_PRIMARY =
  'btn-primary inline-flex h-control min-h-control items-center justify-center rounded-xl font-extrabold tracking-wide transition-transform'

/** Vazgeç / iptal — Yeni Alış Faturası rose gradient */
export const BTN_CANCEL =
  'btn-cancel inline-flex h-control min-h-control items-center justify-center rounded-xl font-extrabold tracking-wide transition-transform'

/** Olumlu — kaydet, onay, WhatsApp, başarı aksiyonları */
export const BTN_SUCCESS =
  'btn-success inline-flex h-control min-h-control items-center justify-center rounded-xl font-extrabold tracking-wide transition-transform'

/** Form geri / nötr chip — header quick-action boyutu, renksiz */
export const BTN_BACK =
  'btn-back inline-flex h-control min-h-control items-center justify-center gap-2.5 rounded-xl border border-dark-500/50 bg-dark-700/70 px-3 text-xs font-extrabold tracking-wide text-gray-300 transition-transform hover:-translate-y-0.5 hover:bg-dark-700 hover:text-white'

/** Üretim sayfası artı (+) butonu — info ton */
export const URETIM_ARTI_BUTTON_CLASS =
  'border border-[color-mix(in_srgb,var(--ds-info)_35%,transparent)] bg-[color-mix(in_srgb,var(--ds-info)_10%,transparent)] text-ds-info transition-colors hover:bg-[color-mix(in_srgb,var(--ds-info)_16%,transparent)]'

/** Düzenleme kalemi — üretim artı butonu ile aynı mavi ton */
export const DUZENLEME_KALEMI_BUTTON_CLASS = `${URETIM_ARTI_BUTTON_CLASS} p-2`

/**
 * çk — standart çöp kutusu (silme) ikon butonu.
 * Kaynak: Müşteriler > Silinenler paneli (`customer-permanent-delete-action`).
 * Kenarlıksız, saydam zemin; hover'da yumuşak kırmızı doku.
 */
export const COP_KUTUSU_BUTTON_CLASS =
  'inline-flex h-8 w-8 items-center justify-center rounded-lg bg-transparent p-1 text-red-500 transition-[background-color,color] hover:bg-red-500/15 hover:text-red-600'

/** çk ikon boyutu — Trash2 için: className={COP_KUTUSU_ICON_CLASS} strokeWidth={2.25} */
export const COP_KUTUSU_ICON_CLASS = 'h-3.5 w-3.5'

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
