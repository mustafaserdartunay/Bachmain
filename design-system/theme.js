/** BachMain Design System (BDS) v1.0 — Theme (day / night) */

import { colors } from './colors.js'
import { shadow, shadowNight } from './shadow.js'

export const themes = {
  day: {
    id: 'day',
    surfaces: colors.day,
    primary: colors.primary,
    secondary: colors.secondary,
    shadow,
  },
  night: {
    id: 'night',
    surfaces: colors.night,
    primary: {
      DEFAULT: colors.night.primary,
      hover: colors.night.primaryHover,
    },
    secondary: {
      DEFAULT: colors.night.secondary,
      hover: colors.night.secondaryHover,
    },
    shadow: shadowNight,
  },
}

export function resolveTheme(mode = 'day') {
  return themes[mode] || themes.day
}

export default themes
