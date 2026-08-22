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
  'customer-page-center-title yfb min-w-0 truncate text-[14px] font-bold uppercase leading-tight tracking-normal text-[var(--muted)]'
export const PAGE_HEADER_CENTER_SLOT_CLASS =
  'app-page-header-center pointer-events-none absolute left-1/2 top-1/2 z-0 w-max max-w-none -translate-x-1/2 -translate-y-1/2'
export const PAGE_HEADER_CENTER_TITLE_CLASS =
  'customer-page-center-title yfb w-auto max-w-none shrink-0 whitespace-nowrap text-center text-[14px] font-bold uppercase leading-tight tracking-normal text-[var(--muted)]'
export const PAGE_SUMMARY_METRICS_CLASS = 'customer-summary-metrics w-full'

/* başlık panel — cam sayfa başlığı: sol geri linki / mutlak merkez başlık / sağ CTA */
export const PAGE_HEADER_SHELL_CLASS =
  'app-page-header relative z-30 flex h-[var(--ds-header-h,4.75rem)] min-h-[var(--ds-header-h,4.75rem)] shrink-0 items-center justify-between gap-3 overflow-visible px-4 py-2 sm:px-6'
export const PAGE_HEADER_BACK_LINK_CLASS =
  'customer-page-back-link group inline-flex shrink-0 items-center gap-2 rounded-xl px-1 py-1 text-[var(--muted)] transition-opacity hover:opacity-80'
export const PAGE_HEADER_BACK_LABEL_CLASS =
  'customer-page-back-link-label yfb min-w-0 truncate text-[14px] font-bold uppercase leading-tight tracking-normal text-[var(--muted)]'
export const PAGE_HEADER_TITLE_SLOT_CLASS = 'shrink-0 w-auto !overflow-visible'
export const PAGE_FILTER_PANEL_CLASS =
  'customer-filter-panel flex h-[var(--ds-header-h,4.75rem)] min-h-[var(--ds-header-h,4.75rem)] w-full items-center'
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

/* ——— sp — silinenler paneli (CustomerDeletedArchivedPanel) ——— */
export const SP_PANEL_SHELL_CLASS =
  'card customer-deleted-archived-panel overflow-hidden p-0 w-full'
export const SP_HEADER_BUTTON_CLASS =
  'flex h-[var(--ds-header-h,4.75rem)] min-h-[var(--ds-header-h,4.75rem)] w-full items-center justify-between gap-3 bg-transparent px-4 py-2 text-left'
export const SP_BODY_CLASS = 'border-t border-[var(--glass-border)] bg-transparent px-4 py-3'
export const SP_EMPTY_CLASS =
  'bg-transparent px-4 py-8 text-center text-[12px] font-normal text-[var(--muted)]'
export const SP_ROW_LIST_CLASS = 'space-y-2'
export const SP_ROW_CLASS = `${APP_METRIC_ROW_CLASS} flex-col !items-stretch gap-3 sm:flex-row sm:!items-center`
export const SP_ROW_TITLE_CLASS = 'text-[12px] font-semibold leading-tight text-[var(--ink)]'
export const SP_ROW_META_CLASS = `${APP_SUBLABEL_CLASS} mt-1`
export const SP_ROW_DETAILS_CLASS =
  'mt-1 text-[11px] font-normal leading-relaxed text-[var(--muted)]'
export const SP_ROW_ACTIONS_CLASS = 'flex shrink-0 items-center justify-end gap-1'
export const SP_CHEVRON_CLASS = 'h-3.5 w-3.5 shrink-0 text-[var(--muted)] transition-transform'

export const APP_OMNI_COLUMN_CLASS = 'glass flex min-h-0 flex-col overflow-hidden rounded-[20px]'
export const APP_OMNI_SECTION_CLASS = 'glass-inset rounded-[16px] p-3'
export const APP_OMNI_CHIP_CLASS =
  'glass-pill !h-8 !rounded-[12px] !px-2.5 !text-[12px] !font-bold uppercase tracking-wide'
export const APP_OMNI_CHIP_ACTIVE_CLASS =
  'glass-pill !h-8 !rounded-[12px] !px-2.5 !text-[12px] !font-bold uppercase tracking-wide !bg-white/55 !text-[var(--ink)]'
export const APP_OMNI_EMPTY_CLASS =
  'px-4 py-8 text-center text-xs font-semibold text-[var(--muted)]'

export const APP_DOT_COLORS = {
  emerald: { ping: 'bg-[#34d399]', dot: 'bg-[#10b981]' },
  rose: { ping: 'bg-[#fb7185]', dot: 'bg-[#e11d48]' },
  amber: { ping: 'bg-[#fbbf24]', dot: 'bg-[#f59e0b]' },
  violet: { ping: 'bg-[#a78bfa]', dot: 'bg-[#8b5cf6]' },
  blue: { ping: 'bg-[#60a5fa]', dot: 'bg-[#2563eb]' },
  orange: { ping: 'bg-[#fb923c]', dot: 'bg-[#ea580c]' },
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
