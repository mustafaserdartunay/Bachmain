# Design System 3.0 Changelog

## 3.0.0 — 2026-07-16

### Added
- `docs/design-system/*` — UI_AUDIT, DESIGN_SYSTEM, TYPOGRAPHY, COLOR_SYSTEM, COMPONENT_GUIDE, RESPONSIVE_GUIDE, UI_FIX_REPORT
- `src/styles/ds-tokens.css` — Chocolate/Copper/Warm White tokens, typography scale, density, shell geometry
- `packages/ui` (`@bachmain/ui`) — Button, Input, Textarea, Card, Badge, Modal, Drawer, Dropdown, Tooltip, MoreMenu, DataTable, Avatar, Tabs, Alert, Empty/Error/Loading
- Shell: Sidebar 280/88, Header 72px, mobile BottomNav, tablet auto-collapse
- `FormWizard`, `ConfirmModal`, `PageSuspense` + lazy routes (Quotes/Orders/Production/Depo)
- Vite alias `@bachmain/ui`

### Changed
- Default form control height → **48px** (`--ds-control-h`)
- Primary buttons → chocolate DS primary (removed dual purple/orange `.btn-primary`)
- List row CTAs → MoreMenu (Production, Quotes, Orders, Depo, Cash cheques)
- Customers list → DataTable (desktop + mobile cards)
- `EditableDropdownPill` default trigger → DS 48px surface

### Migration notes
- Prefer `@bachmain/ui` over ad-hoc `BTN_*` + `bg-dark-*`
- Density: `document.documentElement.dataset.density = 'compact'|'standard'|'comfortable'`
