export const BACHY_ASSET = '/bachy/bachy-reference.png'
export const BACHY_SETTINGS_KEY = 'bach_bachy_settings_v2'
export const BACHY_UPDATED_EVENT = 'bach:bachy-updated'
export const BACHY_REACTION_EVENT = 'bach:bachy-reaction'

export const EMOTIONS = Object.freeze({
  happy: 'happy',
  curious: 'curious',
  surprised: 'surprised',
  thoughtful: 'thoughtful',
  focused: 'focused',
  celebrating: 'celebrating',
  supportive: 'supportive',
  idle: 'idle',
})

/** Never angry — explicit product rule */
export const FORBIDDEN_EMOTIONS = Object.freeze(['angry', 'mad', 'furious'])

export const IDLE_ACTIVITIES = Object.freeze([
  'sip_coffee',
  'take_notes',
  'yawn',
  'check_phone',
  'spin_pen',
  'tie_shoe',
  'fix_hair',
  'lean_logo',
  'swing_leg',
  'hum',
  'mini_dance',
  'look_sky',
  'check_watch',
  'wait_user',
])

export const PRIORITY = Object.freeze({
  critical: 100,
  overdue: 80,
  order: 60,
  success: 40,
  info: 20,
  idle: 0,
})

export const DEFAULT_SETTINGS = Object.freeze({
  enabled: true,
  size: 1, // 0.6 – 1.4
  position: 'logo', // logo (sidebar) — never overlay content panels
  speechFrequency: 'normal', // silent | rare | normal | frequent
  motionIntensity: 'normal', // off | minimal | normal | lively
  mode: 'professional', // fun | professional | minimal
  quietMode: false,
  voiceEnabled: false,
  openaiVoice: false,
  notificationStyle: 'bubble', // bubble | toast | both | none
  motionEnabled: true,
  adviceIntensity: 'balanced', // low | balanced | high
  celebrationAnimations: true,
  specialDayCelebrations: true,
  birthdayCelebrations: true,
  themeNewYear: false,
  themeRamadan: false,
  themeSacrifice: false,
  themeRepublic: false,
  followPointer: true,
  smileOnHover: true,
})
