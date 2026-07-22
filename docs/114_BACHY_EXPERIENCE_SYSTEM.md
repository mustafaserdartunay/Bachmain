# Bachy Experience System v1.0

Premium brand character for bachmain.com — official pose renders + Framer Motion.

## Rule

Does not redesign existing UI. Bachy is additive only.

## Approach

High-fidelity **rendered pose assets** (`public/bachy/*`) + subtle motion.
Not Three.js / R3F in product UI.

## Components (`apps/landing/src/components/bachy/`)

| File                    | Role                            |
| ----------------------- | ------------------------------- |
| `BachyFigure.jsx`       | Pose image + float              |
| `BachyAuthLayout.jsx`   | Login / Register companion      |
| `BachyPricingBuddy.jsx` | Per-plan buddy                  |
| `BachyHero.jsx`         | Hero companion                  |
| `BachyAI.jsx`           | Header chat entry (idle render) |

Never cover inputs, buttons, nav, or dialogs. Respect `prefers-reduced-motion`.
