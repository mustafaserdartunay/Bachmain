# Social Media Center — Architecture & Roadmap

**Version:** 2026-07-21 SC-0  
**Companion:** [111 Gap](./111_SOCIAL_MEDIA_CENTER_GAP_REPORT.md)

## Principles

1. Meta OAuth only — no Instagram passwords stored.
2. Tokens encrypted at rest (`encryptSecret`).
3. AI proposes → human approves → queue publishes.
4. One event bus: `publishDomainEvent`.
5. License may gate AI/multi-account; connect path shared when Meta env set.

## IA (UI)

`/sosyal-medya` — Dashboard, Accounts, Content Studio, AI Creator, Media Library, Campaigns, Scheduler, Calendar, Templates, Brand Kit, Approval, Queue, Analytics, Comments, Messages, Settings.

Redirects: `/ai-buyume` → `/sosyal-medya`.

## Schema (smc_*)

See migration `0016_social_media_center.sql`.

## API

| Method     | Path                                        | Purpose                  |
| ---------- | ------------------------------------------- | ------------------------ |
| GET        | `/v1/social/health`                         | Meta/OpenAI config flags |
| GET        | `/v1/social/instagram/oauth/start`          | OAuth URL                |
| GET        | `/v1/social/instagram/oauth/callback`       | Code exchange            |
| GET/DELETE | `/v1/social/instagram/accounts`             | List / disconnect        |
| POST       | `/v1/social/instagram/accounts/:id/refresh` | Token refresh            |
| POST       | `/v1/social/ai/generate`                    | OpenAI package           |
| CRUD       | `/v1/social/content                         | media                    | brand-kits | templates | campaigns | schedules | approvals | queue | notifications | analytics | audit` | Entities |
| POST       | `/v1/social/publish/:contentId`             | Enqueue now              |
| POST       | `/v1/social/internal/tick`                  | Queue worker             |

## OAuth scopes

`instagram_basic`, `instagram_content_publish`, `pages_show_list`, `pages_read_engagement`, `business_management` (as required by Graph version).

## Content status

`draft` → `review` → `pending_approval` → `approved` → `scheduled` → `published` | `cancelled` | `failed`

## Account status

`live` | `connected` | `expiring` | `error`

## Phases

- **SC-0** — Foundation (this sprint): docs, schema, OAuth, AI, studios UI, scheduler/queue, events
- **SC-1** — Live inbox (comments/DM), analytics Graph sync, dual-write media storage
- **SC-2** — Multi-account, Ads boost, A/B captions
- **SC-3** — Cross-channel (TikTok/LinkedIn) adapters

## Env

`META_APP_ID`, `META_APP_SECRET`, `META_REDIRECT_URI`, `META_GRAPH_VERSION`, `OPENAI_API_KEY`, `JWT_ACCESS_SECRET` (crypto key material)
