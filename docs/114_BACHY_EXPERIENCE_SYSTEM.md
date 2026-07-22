# Bachy Experience System v1.0

Premium brand character for bachmain.com + CRM app.

## Approach

High-fidelity **rendered pose assets** (official Bachy look preserved) + **Framer Motion** micro-animations.
No procedural Three.js mesh in product UI.

## Assets

`apps/landing/public/bachy/*` and `public/bachy/*`

- login, register, starter, pro, enterprise, idle, scenes

## Surfaces

| Surface     | Placement                      |
| ----------- | ------------------------------ |
| `/login`    | Left of form, lean + point     |
| `/register` | Beside form                    |
| `/pricing`  | Per plan card decor            |
| Home hero   | Rise-in near logo/CTA          |
| CRM sidebar | Idle companion by logo (image) |

## Rules

Never cover form text. Mobile scales down. Lazy load images. Respect `prefers-reduced-motion`.
