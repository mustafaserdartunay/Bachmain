# Bachy AIOS — Living AI Operating System (v2.0)

**Status:** Foundation (BY-0)  
**Date:** 2026-07-22

## Purpose

Bachy is not a mascot. It is BachMain’s living AI operating companion — always present, event-aware, and conversational via OpenAI.

## Architecture

```
Layout → BachyProvider → BachyFloating (lazy R3F)
                ↓
         behaviorEngine ← eventBus (subscribeDomainEvents)
                ↓
         settingsStore (local) + OpenAI via /api/voice/chat
```

## Modules

| Path                              | Role                                                  |
| --------------------------------- | ----------------------------------------------------- |
| `src/bachy/settingsStore.js`      | Size, position, modes, speech frequency, celebrations |
| `src/bachy/behaviorEngine.js`     | Priority decisions, idle activities, emotions         |
| `src/bachy/eventBridge.js`        | Maps ERP domain events → Bachy reactions              |
| `src/bachy/context.js`            | Page/company/user/ERP context for OpenAI              |
| `src/bachy/speech.js`             | Dynamic OpenAI replies (no canned scripts)            |
| `src/components/Bachy/*`          | R3F character, chat, quick menu, bubble               |
| `src/pages/BachySettingsPage.jsx` | AIOS → Bachy settings UI                              |

## Character asset

Reference sheet (immutable look): `public/bachy/bachy-reference.png`  
Rendered as GPU-accelerated textured card in R3F with procedural micro-motion.

## Interactions

- Hover → blink / wave
- Double-click → AI chat
- Right-click → Quick AI menu
- Domain events → priority reactions + optional speech

## Settings route

`/aios/bachy` — character size, position, modes, celebrations, speech, motion.

## Event bus

First production consumer of `subscribeDomainEvents` from `src/workflow/eventBus.js`.
