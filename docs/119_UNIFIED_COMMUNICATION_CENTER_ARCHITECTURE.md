# 119 — Unified Communication Center Architecture

**Status:** FAZ 1 in progress  
**Companion:** [118 Gap Report](./118_UNIFIED_COMMUNICATION_CENTER_GAP_REPORT.md)

## Provider lock (do not fake)

| Channel       | Choice                                                                                                                                      | Why                                                                                                    |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Internal chat | Existing Admin JWT + `tenant_data` `ucc` + CRM poll/BroadcastChannel. Socket.IO on `apps/api` in a later cutover when CRM holds API tokens. | Production CRM auth is Admin, not `apps/api`. Vercel cannot host a durable SFU/WS.                     |
| Video SFU     | **LiveKit** (Apache-2.0, self-host or LiveKit Cloud)                                                                                        | Recording, screen share, React SDK, no GPL. Media **never** through Vercel.                            |
| Telephony     | **Telnyx** WebRTC + **BTK-licensed TR SIP BYOC** for +90 geographic DIDs                                                                    | Twilio has no TR geographic DIDs; TR CLI spoofing is restricted. Abstraction: `TelephonyProvider`.     |
| WhatsApp      | **Keep Meta Cloud API** (`whatsappApi.mjs`)                                                                                                 | Official only. Calling API is capability-gated (Cloud number, 2k/day, `calls` webhook). No QR/Baileys. |

## FAZ 1 (this change)

- Right rail **İletişim Merkezi**: Tümü, Sohbet, Görüntülü, Telefon, WhatsApp, Bildirimler, Ekip (existing hub tabs preserved).
- Collapse `[<]` / `[>]`, fullscreen.
- Tenant-scoped 1:1 + group chat, files, reply, edit, delete, pin, star, sent/delivered/read.
- WhatsApp tab **reuses** `/mesajlar` + Cloud send — no rewrite.
- Video/Phone tabs: honest “not provisioned” (no fake in-call UI). Native `tel:` is the only live PSTN action until FAZ 4.
- Customer card: WhatsApp / Ara / Sohbet / Görüşme / E-posta actions.

## Isolation

Every UCC row is keyed by `tenantCode` from the JWT. Conversation membership is checked server-side. Guessing an id cannot cross tenants.

## Later phases (not this PR)

2 LiveKit rooms · 3 meetings/waiting room · 4 Telnyx+SIP · 5 WA templates + calling detect · 6 unified timeline depth · 7 recording/AI/IVR
