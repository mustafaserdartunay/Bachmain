# Color System — Design System 3.0

## Brand

| Role | Name | Hex (day) | CSS var |
|------|------|-----------|---------|
| Primary | Chocolate | `#5C3D2E` | `--ds-primary` |
| Secondary | Copper | `#B87333` | `--ds-secondary` |
| Background | Warm White | `#F7F4EF` | `--ds-bg` |
| Surface | Soft White | `#FFFcf8` | `--ds-surface` |
| Border | Light Gray | `#E5E0D8` | `--ds-border` |

## Semantic

| Role | Hex | CSS var |
|------|-----|---------|
| Success | `#059669` | `--ds-success` |
| Warning | `#EA580C` | `--ds-warning` |
| Danger | `#DC2626` | `--ds-danger` |
| Info | `#2563EB` | `--ds-info` |

## Ink

| Role | Day | Night |
|------|-----|-------|
| Strong | `#1C1917` | `#F5F5F4` |
| Default | `#44403C` | `#E7E5E4` |
| Muted | `#78716C` | `#A8A29E` |

Legacy Bach navy (`#203375`) / sky (`#79A6D2`) remain available as `--bach-navy` / `--bach-sky` for info accents only — **not** primary CTAs.

## Night

Night mode maps surfaces to deep warm neutrals while keeping chocolate/copper accents.

## Rules

- Prefer DS variables over raw Tailwind `dark-*` / `accent-*` in new code  
- Glass effects only where hierarchy needs depth (shell cards) — not on every panel  
