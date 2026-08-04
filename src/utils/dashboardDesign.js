/** Güncel Durum / ModernDashboard ile uyumlu ortak tasarım sınıfları */

/**
 * Canonical zemin paneli — page header kartı ile aynı yüzey.
 * “Zemin paneli ekle” denince her zaman bunu kullan.
 * CSS: `.app-surface-panel` (src/index.css)
 */
export const APP_SURFACE_PANEL_CLASS =
  'app-surface-panel relative rounded-2xl border border-dark-500/50 bg-dark-800/70 shadow-card'

export const APP_PANEL_CLASS = 'glass flex flex-col px-4 py-3'
export const APP_DASHBOARD_PANEL_SIZE_CLASS = 'h-auto w-full shrink-0'
export const APP_DASHBOARD_PANEL_BODY_CLASS = 'flex flex-col justify-start gap-1'
export const APP_DASHBOARD_TIMELINE_RAIL_CLASS = 'modern-dashboard-timeline-rail'
export const APP_PANEL_TITLE_CLASS =
  'yf min-w-0 truncate text-[14px] font-normal leading-tight tracking-normal text-[var(--muted)]'
export const APP_METRIC_ROW_CLASS =
  'glass-inset glass-inset-hover app-metric-row flex w-full min-h-[2.5625rem] items-center justify-between gap-2 px-2 py-1.5 text-left'
export const APP_ACTIVATION_ROW_CLASS =
  'glass-inset glass-inset-hover app-metric-row flex w-full min-h-[5.125rem] items-center justify-between gap-2 px-2 py-2.5 text-left'
/** yf — 14px / 400 / muted (Müşteriler özet metrik etiketi) */
export const APP_LABEL_CLASS =
  'yf app-titlecase-words min-w-0 truncate text-[14px] font-normal leading-tight tracking-normal text-[var(--muted)]'
export const YF_TEXT_CLASS =
  'yf min-w-0 truncate text-[14px] font-normal leading-tight tracking-normal text-[var(--muted)]'
/** yfb — 14px / 700 */
export const YFB_TEXT_CLASS =
  'yfb min-w-0 truncate text-[14px] font-bold leading-tight tracking-normal text-[var(--muted)]'
/** yf ölçeği; gradient CTA üzerinde beyaz */
export const YF_TEXT_ON_COLOR_CLASS =
  'yf yf-on-color header-quick-action-label min-w-0 truncate text-[14px] font-normal leading-tight tracking-normal text-[#ffffff]'
export const APP_SUBLABEL_CLASS =
  'yf app-titlecase-words min-w-0 truncate text-[14px] font-normal leading-tight tracking-normal text-[var(--muted)]'
export const APP_VALUE_CLASS =
  'yfb tabular-nums text-[14px] font-bold leading-tight tracking-normal'
export const APP_ICON_SM_CLASS = 'h-3.5 w-3.5 shrink-0'
export const APP_ICON_WRAP_CLASS =
  'flex h-8 w-8 shrink-0 items-center justify-center rounded-[11px] bg-[rgba(140,145,165,0.14)] text-[var(--muted)]'
/** Sayfa başlığı — Müşteriler merkez başlık (yfb uppercase) */
export const APP_PAGE_TITLE_CLASS =
  'customer-page-center-title truncate text-[14px] font-bold uppercase leading-tight tracking-normal text-[var(--muted)]'
export const APP_FILTER_LABEL_CLASS =
  '!mb-0 shrink-0 min-w-0 truncate text-[14px] font-normal leading-tight tracking-normal text-[var(--muted)]'

/* ——— Müşteriler kanonik sayfa tokenları (tüm liste/rapor ekranları) ——— */
export const PAGE_TYPE_SHELL_CLASS = 'page-type-shell customers-page-type w-full'
export const PAGE_CENTER_TITLE_CLASS =
  'customer-page-center-title uppercase font-bold'
export const PAGE_SUMMARY_METRICS_CLASS = 'customer-summary-metrics w-full'
export const PAGE_FILTER_PANEL_CLASS =
  'customer-filter-panel flex min-h-[4.75rem] w-full items-center'
export const PAGE_FILTER_BAR_CLASS =
  'app-filter-bar grid min-w-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4'
export const PAGE_FILTER_FIELD_CLASS =
  'customer-filter-field grid h-9 min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-2 rounded-full px-3'
export const PAGE_FILTER_LABEL_CLASS = APP_FILTER_LABEL_CLASS
export const PAGE_FILTER_PILL_CLASS = 'glass-pill customer-filter-pill'
export const PAGE_FILTER_MENU_CLASS = 'az customer-filter-dropdown-menu customers-page-menu'
export const PAGE_TABLE_HEADER_CLASS =
  'h-[var(--ds-row-h,2.75rem)] px-3 min-w-0 truncate !text-[14px] !font-normal !leading-tight !tracking-normal uppercase !text-[var(--muted)]'
export const PAGE_ROW_MENU_CLASS = 'az customer-filter-dropdown-menu customers-page-menu'
export const PAGE_LIST_MENU_CLASS =
  'az customer-filter-dropdown-menu customers-page-menu !min-w-[18rem] w-[18rem]'
export const PAGE_LIST_PILL_CLASS = 'glass-pill customer-list-dropdown-pill'
export const PAGE_LIST_PILL_WRAPPER_CLASS = 'relative inline-flex min-w-0 w-max max-w-full'
export const PAGE_BALANCE_AMOUNT_CLASS =
  'customer-balance-amount tabular-nums text-[14px] font-bold leading-tight tracking-normal'

export const APP_OMNI_COLUMN_CLASS = 'glass flex min-h-0 flex-col overflow-hidden rounded-[20px]'
export const APP_OMNI_SECTION_CLASS = 'glass-inset rounded-[16px] p-3'
export const APP_OMNI_CHIP_CLASS =
  'glass-pill !h-8 !rounded-[12px] !px-2.5 !text-[12px] !font-bold uppercase tracking-wide'
export const APP_OMNI_CHIP_ACTIVE_CLASS =
  'glass-pill !h-8 !rounded-[12px] !px-2.5 !text-[12px] !font-bold uppercase tracking-wide !bg-white/55 !text-[var(--ink)]'
export const APP_OMNI_EMPTY_CLASS =
  'px-4 py-8 text-center text-xs font-semibold text-[var(--muted)]'

export const APP_DOT_COLORS = {
  emerald: { ping: 'bg-emerald-400', dot: 'bg-emerald-500' },
  rose: { ping: 'bg-rose-400', dot: 'bg-rose-500' },
  amber: { ping: 'bg-amber-400', dot: 'bg-amber-500' },
  violet: { ping: 'bg-violet-400', dot: 'bg-violet-500' },
  blue: { ping: 'bg-blue-400', dot: 'bg-blue-500' },
  orange: { ping: 'bg-orange-400', dot: 'bg-orange-500' },
}

/** Aktivasyon Zaman Tablosu — nokta + tutar renkleri (header hızlı aksiyon tonlarıyla uyumlu) */
export const APP_ACTIVATION_TONES = {
  overdue: {
    ping: 'bg-[#fb7185]',
    dot: 'bg-[#e11d48]',
    amount: 'text-[#e11d48]',
  },
  today: {
    ping: 'bg-[#7cf2c6]',
    dot: 'bg-[#10b981]',
    amount: 'text-[#10b981]',
  },
  soon: {
    ping: 'bg-[#ffd27f]',
    dot: 'bg-[#ea580c]',
    amount: 'text-[#ea580c]',
  },
  week2: {
    ping: 'bg-[#8ad9ff]',
    dot: 'bg-[#3b82f6]',
    amount: 'text-[#3b82f6]',
  },
  future: {
    ping: 'bg-[rgba(140,145,165,0.55)]',
    dot: 'bg-[rgba(140,145,165,0.85)]',
    amount: 'text-[var(--ink)]',
  },
}

export function getActivationAccentTone(item) {
  return APP_ACTIVATION_TONES[item.urgency] || APP_ACTIVATION_TONES.future
}

export function getActivationAmountTone(item) {
  return (APP_ACTIVATION_TONES[item.urgency] || APP_ACTIVATION_TONES.future).amount
}
