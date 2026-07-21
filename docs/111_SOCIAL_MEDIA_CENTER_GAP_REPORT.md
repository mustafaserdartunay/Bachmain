# Social Media Center — Gap Report (SC-0)

**Date:** 2026-07-21  
**Companion:** [112 Architecture/Roadmap](./112_SOCIAL_MEDIA_CENTER_ARCHITECTURE_ROADMAP.md)

## Current state (pre-SC-0)

| Area                      | Gap                                                                        |
| ------------------------- | -------------------------------------------------------------------------- |
| UI                        | AI Growth narrowed to Instagram demo connect + reel example (`/ai-buyume`) |
| OAuth                     | No Meta OAuth; localStorage username demo only                             |
| Tokens                    | Not encrypted server-side                                                  |
| Publish                   | No Graph publish / queue                                                   |
| AI                        | OpenAI via `/api/growth/chat` for text packages only                       |
| Schema                    | `growth_channel_accounts` stub without ciphertext tokens                   |
| Scheduler                 | Calendar UI stub, no recurrence engine                                     |
| Approval / Queue          | Missing                                                                    |
| Analytics / Comments / DM | Missing                                                                    |

## Target (SC-0)

Enterprise **Social Media Center** at `/sosyal-medya` with Instagram AI Content Studio: Meta OAuth, encrypted tokens, AI content types, studios, brand kit, templates, scheduler, calendar, approval, queue, analytics shells, ERP/workflow events.

## Risks

- Meta App Review / Business verification outside codebase
- Public media URL required for Graph image/reel containers
- Video render not in scope (Reels = scenario + media ref)
