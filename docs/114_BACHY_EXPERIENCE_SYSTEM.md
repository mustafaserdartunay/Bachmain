# Bachy Experience System v3.0 (Web)

Living 3D Bachy companion for bachmain.com. **Does not redesign existing UI.**

## Rule

Existing panels, cards, forms, and layouts stay intact. Bachy is an additive companion only.

## Stack

React Three Fiber + Three.js + Framer Motion. Procedural mesh (no static pose PNG in product UI).

## Components (`apps/landing/src/components/bachy/`)

| File                  | Role                          |
| --------------------- | ----------------------------- |
| `Bachy.jsx`           | Canvas + character entry      |
| `BachyLogin.jsx`      | Login/Register side companion |
| `BachyPricing.jsx`    | Per-plan buddy                |
| `BachyHero.jsx`       | Hero companion                |
| `BachyAI.jsx`         | Header chat entry             |
| `BachyAnimations.jsx` | Pose/mood helpers             |

## Surfaces

- `/login`, `/register` — beside form
- `/pricing` — card companions
- Home hero — left of content
- Header — logo-adjacent AI dock

Never cover inputs, buttons, nav, or dialogs. Respect `prefers-reduced-motion`.
