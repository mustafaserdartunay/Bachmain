/** BachMain Design System (BDS) v1.0 — Soft Apple-style shadows */

export const shadow = {
  /** Layer 1 — resting controls / pills */
  layer1: '0 1px 2px rgba(28, 25, 23, 0.04), 0 2px 8px rgba(28, 25, 23, 0.06)',
  /** Layer 2 — cards / raised panels */
  layer2: '0 4px 12px -4px rgba(28, 25, 23, 0.08), 0 10px 28px -10px rgba(28, 25, 23, 0.12)',
  /** Layer 3 — dialogs / drawers / popovers */
  layer3: '0 12px 32px -12px rgba(28, 25, 23, 0.16), 0 24px 56px -16px rgba(28, 25, 23, 0.2)',
  /** CSS bridge aliases */
  xs: '0 1px 2px rgba(28, 25, 23, 0.04)',
  sm: '0 1px 2px rgba(28, 25, 23, 0.04), 0 2px 8px rgba(28, 25, 23, 0.06)',
  md: '0 4px 12px -4px rgba(28, 25, 23, 0.08), 0 10px 28px -10px rgba(28, 25, 23, 0.12)',
  lg: '0 12px 32px -12px rgba(28, 25, 23, 0.16), 0 24px 56px -16px rgba(28, 25, 23, 0.2)',
  xl: '0 16px 40px -12px rgba(28, 25, 23, 0.18), 0 28px 64px -16px rgba(28, 25, 23, 0.22)',
}

export const shadowNight = {
  layer1: '0 1px 2px rgba(0, 0, 0, 0.2), 0 2px 8px rgba(0, 0, 0, 0.24)',
  layer2: '0 4px 12px -4px rgba(0, 0, 0, 0.32), 0 10px 28px -10px rgba(0, 0, 0, 0.4)',
  layer3: '0 12px 32px -12px rgba(0, 0, 0, 0.45), 0 24px 56px -16px rgba(0, 0, 0, 0.55)',
}

export default shadow
