# Component Guide — Design System 3.0

Import from `@bachmain/ui`.

## Button

Sizes: `sm` | `md` (default, 48px) | `lg`  
Variants: `primary` | `secondary` | `ghost` | `outline` | `danger` | `success`  
Also: `icon` / `iconOnly`

```jsx
import { Button } from '@bachmain/ui'
<Button variant="primary" size="md">Kaydet</Button>
```

## Input

Height **48px** (standard density). Textarea auto-height.

```jsx
import { Input, Textarea } from '@bachmain/ui'
```

## Card

Radius **16px**, soft shadow. Use for panels; avoid nested heavy glass.

## Modal / Drawer / Popover / Tooltip / Dropdown

Single z-index scale from tokens. Escape + focus trap required for Modal/Drawer.

## DataTable

- Desktop: grid with truncate + tooltip  
- Tablet: horizontal responsive  
- Mobile: **card view**  
- Row actions: **MoreMenu** only (`•••`) — not inline CTA clusters  

## MoreMenu actions

Sil, Düzenle, Kopyala, Yazdır, Excel, PDF, Paylaş, Mail — inside overflow menu.

## States

`EmptyState`, `ErrorState`, `LoadingState` (Skeleton) for every list/page.

## Spacing / Radius / Shadow

See DESIGN_SYSTEM.md — 4px grid; radius 8/12/16/24/32; shadow XS→XL.
