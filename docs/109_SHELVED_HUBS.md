# Shelved hubs (hidden from product UI)

**Date:** 2026-07-21  
**Status:** Shelved — not deleted. Restore when product owner asks.

These modules were removed from sidebar and CRM routes. Page/API/localStore code remains in the repo.

## Shelved surfaces

| Hub               | Former routes                       | Page                                | LocalStore keys                                    |
| ----------------- | ----------------------------------- | ----------------------------------- | -------------------------------------------------- |
| AI Command Center | `/`, `/ai-komut`, `/command-center` | `src/pages/AiCommandCenterPage.jsx` | `bach_command_center_*` (see `src/commandCenter/`) |
| Marketplace       | `/marketplace`, `/magaza`           | `src/pages/MarketplacePage.jsx`     | `bach_marketplace_mp0_v1`                          |
| Integration Hub   | `/entegrasyon`, `/integration-hub`  | `src/pages/IntegrationHubPage.jsx`  | `bach_integration_hub_ih0_v1`                      |
| Commerce Cloud    | `/ticaret`, `/commerce`, `/bayi`    | `src/pages/CommerceCenterPage.jsx`  | `bach_commerce_gc0_v1`                             |
| Platform Core     | `/platform`, `/cekirdek`            | `src/pages/PlatformCenterPage.jsx`  | `bach_platform_pc0_v1`                             |

### Sidebar-only (routes still work)

| Hub                 | Route            | Restore                            |
| ------------------- | ---------------- | ---------------------------------- |
| Workflow Engine     | `/otomasyon`     | `processMenu.js` → `hidden: false` |
| AI Operating System | `/aios`          | `processMenu.js` → `hidden: false` |
| Knowledge Center    | `/bilgi-merkezi` | `processMenu.js` → `hidden: false` |
| Digital Twin        | `/dijital-ikiz`  | `processMenu.js` → `hidden: false` |

## Related (still in tree, not wired in App routes while shelved)

- Menus: `src/data/marketplaceMenu.js`, `integrationHubMenu.js`, `platformMenu.js`, `commerceMenu.js`
- API: `apps/api/src/modules/marketplace|integrations|platform|commerce|aios` (command center uses AIOS)
- Docs: `docs/90`–`107`, `102`–`107`

## How to restore

1. Re-add routes in `src/App.jsx` (see git history around shelve commit).
2. Re-add sidebar entries in `src/components/Layout/Sidebar.jsx` (`baseMenuItems` + AI Command NavLink).
3. Re-add `Commerce Cloud` in `src/data/processMenu.js` if needed.
4. Point `/` back to `AiCommandCenterPage` only if Command Center should be home again; otherwise keep `/` → Güncel Durum.

Registry flag: `src/archive/shelvedHubs.js`
