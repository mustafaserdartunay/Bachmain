# Bachy Experience System v1.0

Premium brand character for bachmain.com — official pose renders + Framer Motion.

## Rule

Does not redesign existing UI. Bachy is additive only.

## Approach

High-fidelity **rendered pose assets** (`public/bachy/*`) + subtle motion.
Not Three.js / R3F in product UI.

## Components

| File                                                      | Role                               |
| --------------------------------------------------------- | ---------------------------------- |
| `apps/landing/src/components/marketing/BachyRegister.tsx` | Register-only companion (additive) |

Rule: never rebuild the register form — Bachy sits beside / above the existing panel.
Never cover inputs, buttons, nav, or dialogs. Respect `prefers-reduced-motion`.
