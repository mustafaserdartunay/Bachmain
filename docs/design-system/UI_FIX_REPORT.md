# UI Fix Report — Design System 3.0

**Updated:** 2026-07-16

## Progress

| Phase | Status | Notes |
|-------|--------|-------|
| 0 Docs | Done | `docs/design-system/*` |
| 1 Tokens | Done | `ds-tokens.css`, Tailwind `ds.*`, form-input 48px, dual btn/card CSS fixed |
| 2 packages/ui | Done | Button, Input, Card, Modal, Drawer, Dropdown, Tooltip, MoreMenu, DataTable, States, Tabs, Avatar, Badge, Alert |
| 3 Shell | Done | Sidebar 280/88, Header 72px, BottomNav, tablet auto-collapse, mobile inset |
| 4 DataTable | Done | Customers → DataTable; Production/Quotes/Orders/Depo/Cash → MoreMenu actions |
| 5 Sweep | Done | FormWizard, ConfirmModal, buttonStyles → DS, EditableDropdownPill 48px |
| 6 Accept | Done | Lazy routes + Suspense skeleton; density default; checklist below |

## Fixes applied

- Chocolate/Copper/Warm White token bridge; night density-aware surfaces
- Removed conflicting `@layer .btn-primary` orange / dark `.card`
- Shell geometry tokens: `--ds-sidebar-expanded` 280px, `--ds-sidebar-collapsed` 88px, `--ds-header-h` 72px
- Mobile Bottom Navigation (Dashboard / CRM / Bildirim / Arama / Profil)
- List row CTA overflow → `MoreMenu` on Production, Quotes, Orders, Depo, Cash cheques
- Customers list migrated to `@bachmain/ui` DataTable (desktop table + mobile cards)
- Vite alias `@bachmain/ui` → `packages/ui`
- Lazy-loaded Quotes / Orders / Production / Depo with `LoadingState` fallback

## Responsive checklist (manual)

| Breakpoint | Sidebar | Lists | Notes |
|------------|---------|-------|-------|
| 320–480 | Drawer + BottomNav | Card view (DataTable) | OK |
| 768–900 | Collapsed 88px | Table / MoreMenu | OK |
| ≥1024 | 280px expandable | Full table | OK |

## Remaining debt (next iterations)

- Full `bg-dark-*` JSX purge across all pages
- Replace remaining `window.confirm` with `ConfirmModal`
- Migrate remaining list pages to DataTable
- Column resize / saved filters / Excel-like filters (Adaptive DataGrid v2)
- User workspace DB sync (Adaptive Experience)
