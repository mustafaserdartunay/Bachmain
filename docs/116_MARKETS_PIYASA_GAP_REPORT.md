# Markets / Piyasa — Gap Report

## Status

Header banner popover (`HeaderMarketRates`): live USD / EUR / gram gold via
existing `useExchangeRates` (Truncgil → Open ER → Frankfurter), sparkline history,
and **per-panel TL converter** (foreign ↔ ₺).

## Boundary

Do **not** reuse `/finans` treasury/GL. Shared FX hook is OK for mid rates only.
