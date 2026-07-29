export function requiredEnv(name: string): string | null {
  const value = process.env[name]?.trim()
  return value || null
}

export function hasCredentials(keys: string[]): boolean {
  return keys.every((key) => Boolean(process.env[key]?.trim()))
}

export const CREDENTIALS = {
  memberEmail: () => requiredEnv('E2E_MEMBER_EMAIL'),
  memberPassword: () => requiredEnv('E2E_MEMBER_PASSWORD'),
  adminEmail: () => requiredEnv('E2E_ADMIN_EMAIL'),
  adminPassword: () => requiredEnv('E2E_ADMIN_PASSWORD'),
}
