/**
 * Modular Bachy animation / pose helpers (no UI chrome).
 */

export const POSE = {
  idle: 'idle',
  login: 'login',
  register: 'register',
  starter: 'starter',
  pro: 'pro',
  enterprise: 'enterprise',
  celebrate: 'celebrate',
}

export const MOOD = {
  curious: 'curious',
  focus: 'focus',
  shy: 'shy',
  happy: 'happy',
}

/** Map surface mood → character look / activity */
export function moodToCharacter(mood, celebrating) {
  if (celebrating) {
    return { emotion: 'celebrating', activity: 'mini_dance', lookAway: false, point: true }
  }
  switch (mood) {
    case MOOD.focus:
      return { emotion: 'curious', activity: 'point', lookAway: false, point: true }
    case MOOD.shy:
      return { emotion: 'shy', activity: 'wait_user', lookAway: true, point: false }
    case MOOD.happy:
      return { emotion: 'happy', activity: 'hop', lookAway: false, point: false }
    default:
      return { emotion: 'idle', activity: 'wait_user', lookAway: false, point: true }
  }
}

export function planToPose(planId) {
  if (planId === 'enterprise') return POSE.enterprise
  if (planId === 'starter') return POSE.starter
  return POSE.pro
}

export function poseToCharacter(pose, hover = false) {
  switch (pose) {
    case POSE.login:
    case POSE.register:
    case POSE.starter:
      return {
        emotion: 'curious',
        activity: 'point',
        lookAway: false,
        point: true,
        lounge: false,
        hug: false,
        sunglasses: false,
        lemonade: false,
        hearts: false,
      }
    case POSE.pro:
      return {
        emotion: hover ? 'happy' : 'happy',
        activity: hover ? 'hug_tight' : 'hug',
        lookAway: false,
        point: false,
        lounge: false,
        hug: true,
        sunglasses: false,
        lemonade: false,
        hearts: true,
      }
    case POSE.enterprise:
      return {
        emotion: hover ? 'happy' : 'idle',
        activity: hover ? 'vip_salute' : 'lounge',
        lookAway: false,
        point: false,
        lounge: !hover,
        hug: false,
        sunglasses: true,
        lemonade: !hover,
        hearts: false,
      }
    case POSE.celebrate:
      return {
        emotion: 'celebrating',
        activity: 'mini_dance',
        lookAway: false,
        point: false,
        lounge: false,
        hug: false,
        sunglasses: false,
        lemonade: false,
        hearts: false,
      }
    default:
      return {
        emotion: 'idle',
        activity: 'wait_user',
        lookAway: false,
        point: false,
        lounge: false,
        hug: false,
        sunglasses: false,
        lemonade: false,
        hearts: false,
      }
  }
}

/** Soft idle motion scalars — used inside useFrame */
export function idleMotion(t, intensity = 1) {
  return {
    breath: 1 + Math.sin(t * 1.55) * 0.016 * intensity,
    bob: Math.sin(t * 1.1) * 0.018 * intensity,
    hair: Math.sin(t * 2.1) * 0.035 * intensity,
    ear: Math.sin(t * 1.4) * 0.04 * intensity,
    brow: Math.sin(t * 0.7) * 0.02 * intensity,
    neon: 0.55 + (Math.sin(t * 2.4) * 0.5 + 0.5) * 0.55,
    blink: Math.sin(t * 0.35) > 0.992,
  }
}

export const CONFETTI_COLORS = ['#2563eb', '#f59e0b', '#22c55e', '#ec4899', '#38bdf8']
