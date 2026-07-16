# BachMain Enterprise Design System 3.0

## Purpose

A single professional design language for the entire BachMain ERP so that modules added years from now still look and behave consistently.

**References (inspiration only — not copies):** Apple HIG, Linear, Notion, Stripe, ClickUp, HubSpot, Odoo, Dynamics, SAP Fiori, Figma DS.

## Principles

1. **One system** — all modules consume `@bachmain/ui` + DS tokens  
2. **Token-first** — no random hex / font sizes in features  
3. **Density-aware** — Compact / Standard / Comfortable via `data-density`  
4. **Overflow strategy** — never shrink type; use Tooltip / Popover / Drawer / MoreMenu  
5. **Preserve logic** — UI migration must not change backend or business stores  

## Architecture

```
src/styles/ds-tokens.css     → CSS variables
tailwind.config.js           → ds-* theme extend
packages/ui                  → React primitives (@bachmain/ui)
src/components/Layout        → Shell consumes DS
src/pages/*                  → Gradual migration
```

## Shell geometry

| Element | Spec |
|---------|------|
| Sidebar expanded | 280px |
| Sidebar collapsed | 88px |
| Header | 72px |
| Mobile sidebar | Drawer |
| Mobile nav | Bottom Navigation |

## Motion

| Interaction | Duration |
|-------------|----------|
| Hover | 150ms |
| Dropdown | 200ms |
| Drawer | 250ms |
| Page transition | 300ms |

## Icons

Lucide only — sizes **16 / 18 / 20 / 24 / 32**.

## Related docs

- [TYPOGRAPHY.md](./TYPOGRAPHY.md)
- [COLOR_SYSTEM.md](./COLOR_SYSTEM.md)
- [COMPONENT_GUIDE.md](./COMPONENT_GUIDE.md)
- [RESPONSIVE_GUIDE.md](./RESPONSIVE_GUIDE.md)
- [UI_AUDIT.md](./UI_AUDIT.md)
- [UI_FIX_REPORT.md](./UI_FIX_REPORT.md)
- [CHANGELOG.md](./CHANGELOG.md)
