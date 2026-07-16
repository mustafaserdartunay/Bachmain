# Typography — Design System 3.0

## Font stack

```css
font-family: Inter, system-ui, "SF Pro Display", Geist, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
```

## Scale (only these sizes)

| Token | Size | Weight | Use |
|-------|------|--------|-----|
| Display XL | 40px | 700 | Landing only |
| H1 | 32px | 700 | Page titles |
| H2 | 24px | 600 | Section titles |
| H3 | 20px | 600 | Card titles |
| Body Large | 16px | 400 | Emphasized body |
| Body | 15px | 400 | Default body |
| Small | 13px | 400 | Secondary / meta |
| Caption | 12px | 400 | Labels, hints |

## CSS variables

```css
--ds-font-display: 40px;
--ds-font-h1: 32px;
--ds-font-h2: 24px;
--ds-font-h3: 20px;
--ds-font-body-lg: 16px;
--ds-font-body: 15px;
--ds-font-small: 13px;
--ds-font-caption: 12px;
```

## Rules

- No ad-hoc `text-[Npx]` in feature code after migration  
- Prefer utility classes: `ds-h1`, `ds-h2`, `ds-body`, `ds-small`, `ds-caption`  
- Do not shrink font to fit; use truncate + tooltip  

## Line height

| Role | Line height |
|------|-------------|
| Display / H1–H3 | 1.25 |
| Body | 1.5 |
| Small / Caption | 1.4 |
