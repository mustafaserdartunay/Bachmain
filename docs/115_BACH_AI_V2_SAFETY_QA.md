# 115 — Bach AI V2 Production Safety + QA

Companion to `114_BACH_AI_V2_CURRENT_STATE_REPORT.md` and the V2 implementation plan.

## Safety rules

| Rule | Status |
|------|--------|
| OpenAI API key never in frontend | Enforced — Realtime uses ephemeral `client_secret` from `POST /api/ai/realtime/session` |
| AI proxy rate limit + optional `AI_PROXY_SECRET` | Existing `server/env.js` guards on V2 routes |
| Tool auth soft-gate (`X-User-Id` / `X-Company-Id`) | Action Engine; full JWT when CRM voice moves to `apps/api` |
| Confirmation gate for risky creates | `create_offer_draft` + `needsConfirmation` |
| Idempotency on create_* | In-memory key cache (offer draft) |
| Audit metadata-only | `audit` objects — no transcript / PII dumps |
| User-facing errors | `server/ai/userErrors.js` (429 → yoğunluk, 401 → yetki, …) |
| Wake word stays local | No cloud audio while IDLE / LISTENING_FOR_WAKE_WORD |
| Background mic | Not supported (web + iOS foreground only) |

## Test matrix

| Area | Case | Expected |
|------|------|----------|
| Phase 0 JSON | `/api/voice/chat` with `json: true` + Responses model | 200; no “must contain json” 400 |
| Legacy voice | Header mic STT → chat → `executeVoiceActions` | Unchanged behavior |
| Intent | `POST /api/ai/v2/intent` “Ahmet için teklif” | intent `create_offer`, confirmation or actions |
| Tool | `POST /api/ai/v2/tool` `search_customer` | `clientAction` returned |
| Realtime session | `POST /api/ai/realtime/session` | `clientSecret` present; key not in body |
| Wake | Phrase “hey bach” / block “bachmain” | Match / reject |
| Silence | Command silence 3000ms default | `final_silence` → PROCESSING |
| EoS | SHORT / LONG / FINAL timers | Reset on speech; FINAL ends turn |
| Sync | Socket room `company:{cid}` | `offer.created` metadata-only |
| iOS | Foreground leave | Session end; no background listen claim |
| Security | Missing proxy secret (prod) | 401/403 |
| Dup | Same idempotency key | `duplicate: true` |

## Lint / build checklist

- [ ] `node --check server/ai/*.js server/openaiModels.js server/index.js`
- [ ] CRM `npm run build` (or Vite build used in CI)
- [ ] Smoke Header AI + customer row mic
- [ ] Deploy CRM (`bachmain` / ship script)

## Out of scope (documented)

- Android native app
- App Store background always-on wake
- Full JWT on CRM Express proxy (deferred to apps/api cutover)
