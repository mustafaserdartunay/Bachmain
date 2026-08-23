# BachMain Piyasa — Architecture & Roadmap

**Companion:** [116 Gap Report](./116_MARKETS_PIYASA_GAP_REPORT.md)

## Principles

1. **Additive** — new `/piyasa` hub; ERP cash/GL unchanged.
2. **Provider abstraction** — `MarketDataProvider` (mock → Twelve/iTick/etc.).
3. **Tenant isolation** — `company_id` (+ `user_id` for personal layouts).
4. **Cache first** — short TTL quotes, longer history; Redis when available.

## UI (MKT-0)

| Route | Role |
| ----- | ---- |
| `/piyasa` | Markets hub (overview tabs) |
| Header chip **Piyasa** | Opens `/piyasa` |

## Phases

- **MKT-0** — Menu, header icon, hub shell, mock overview  
- **MKT-1** — Backend provider + cache + poll  
- **MKT-2** — Favorites, detail, charts  
- **MKT-3** — Alerts, portfolios, admin, packages  
