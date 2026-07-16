# Responsive Guide — Design System 3.0

## Breakpoints (test matrix)

320, 360, 375, 390, 414, 480, 768, 820, 900, 1024, 1280, 1366, 1440, 1600, 1920

## Layout behavior

| Viewport | Sidebar | Main |
|----------|---------|------|
| Mobile (&lt;768) | Drawer + Bottom Nav | Full width, card lists |
| Tablet (768–1023) | Collapsed (88px) | Comfortable density OK |
| Desktop (≥1024) | Expanded (280px) or Mini | Full DataTable |

## Tables

- **Never** wrap cell text to “fix” overflow  
- Desktop: DataTable grid  
- Tablet: responsive table / horizontal scroll with sticky first col  
- Mobile: **Card view** (dedicated layout, not shrunk desktop)

## Narrow space strategy

Use Tooltip, Popover, Drawer, Accordion, Bottom Sheet, Overflow Menu — **do not** shrink fonts or crush components.

## Touch

Comfortable density recommended for tablets; controls ≥ 44–48px hit targets.
