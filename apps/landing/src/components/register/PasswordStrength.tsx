type PasswordStrengthProps = {
  password: string
}

const RULES = [
  { id: 'len', label: 'En az 8 karakter', test: (p: string) => p.length >= 8 },
  { id: 'lower', label: 'Küçük harf', test: (p: string) => /[a-z]/.test(p) },
  { id: 'upper', label: 'Büyük harf', test: (p: string) => /[A-Z]/.test(p) },
  { id: 'digit', label: 'Rakam', test: (p: string) => /[0-9]/.test(p) },
  { id: 'special', label: 'Özel karakter (!@#$%…)', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
] as const

export function passwordIssues(password: string): string | null {
  for (const rule of RULES) {
    if (!rule.test(password || '')) return `Şifre: ${rule.label} gerekli`
  }
  return null
}

export default function PasswordStrength({ password }: PasswordStrengthProps) {
  return (
    <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
      {RULES.map((rule) => {
        const ok = rule.test(password || '')
        return (
          <li
            key={rule.id}
            className={`text-[12px] font-medium ${ok ? 'text-[#16A34A]' : 'text-[#94A3B8]'}`}
          >
            {ok ? '✓' : '○'} {rule.label}
          </li>
        )
      })}
    </ul>
  )
}
