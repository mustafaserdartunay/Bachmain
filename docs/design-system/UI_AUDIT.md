# BachMain UI Audit — Design System 3.0

**Date:** 2026-07-16  
**Scope:** CRM (`src/`), Layout, forms, tables, themes  
**Status:** Baseline audit before DS 3.0 migration

---

## Executive summary

The CRM UI currently runs **three parallel visual languages**:

1. Glass system (`.card`, `.glass-inset`, warm frosted surfaces)
2. Legacy Tailwind dark tokens (`bg-dark-*`, ~900 usages) remapped via CSS
3. Ad-hoc per-page class recipes

There is **no shared `packages/ui`**. Control heights cluster around **36–40px** (target DS: **48px**). Primary list screens use **inline CSS grids** that bypass responsive rules — **no mobile card views**.

---

## Critical (P0)

| Issue | Evidence | Impact |
|-------|----------|--------|
| No 48px control contract | `.form-input` `min-height: 2.5rem`; `EditableDropdownPill` default `h-9` | Inconsistent forms |
| Typography chaos | `text-[10px]`…`text-xl`, `font-black` mixed | No hierarchy |
| Lists not responsive | Inline `gridTemplateColumns` on Quotes/Orders/Production/Depo/Cash | Mobile broken |
| Action column overflow | Production 168px; Cash cheque 340px | Text/icon clip |
| Dual theme APIs | `appearanceMode` (day/night) vs `themeMode` (6 modes) | Desync risk |

## High (P1)

| Issue | Evidence |
|-------|----------|
| No shared Modal | 18× `fixed inset-0`, 6 z-indexes |
| Dual `.btn-primary` / `.card` CSS | Glass gradient vs `@layer` orange/dark |
| `var(--surface)` dark in `:root` | Light panels can turn navy |
| Shell geometry | Sidebar ~280/76 vs target 280/88; Header ~76 vs 72 |
| Settings local-only | `bach-appearance`, `erlenbox-sidebar` |

## Medium / Low (P2)

- ~30 `window.confirm` vs `ListDeleteConfirmPanel`
- Dead `OrdersListTable.jsx`
- Mobile shell missing horizontal inset
- Night mode incomplete (search/TeamHub stay white)
- Sidebar `capitalize` mangles Turkish labels

---

## Highest-risk screens

- `src/pages/QuotesPage.jsx`
- `src/pages/OrdersPage.jsx`
- `src/pages/ProductionPage.jsx`
- `src/pages/CashPage.jsx` + `src/components/Cash/*`
- `src/components/Depo/DepoWorkspace.jsx`
- `src/pages/CustomersPage.jsx`

---

## Counts (approx.)

| Pattern | Count |
|---------|------:|
| `bg-dark-*` | ~900 |
| `form-input` | ~431 |
| `BTN_PRIMARY` / `BTN_SUCCESS` | ~146 |
| `EditableDropdownPill` | ~101 |
| Modal overlays | ~18 |
| Intentional 48px fields | 0 |

---

## Migration priority

1. Tokens + resolve dual CSS  
2. `packages/ui` primitives  
3. Shell (280/88, 72, BottomNav)  
4. DataTable + list migration  
5. Form/Modal sweep + `bg-dark-*` purge  
6. Performance + acceptance
