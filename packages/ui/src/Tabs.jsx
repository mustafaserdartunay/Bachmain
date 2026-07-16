export function Tabs({ value, onChange, items = [], className = '' }) {
  return (
    <div className={`flex flex-wrap gap-1 rounded-ds-lg border border-ds-border bg-[var(--ds-surface-muted)] p-1 ${className}`} role="tablist">
      {items.map((item) => {
        const active = item.value === value
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange?.(item.value)}
            className={`rounded-ds-md px-3 py-2 text-ds-small font-semibold transition-colors duration-hover ${
              active ? 'bg-ds-surface text-ds-ink shadow-ds-xs' : 'text-ds-muted hover:text-ds-ink'
            }`}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}

export default Tabs
