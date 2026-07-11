import * as Tabs from '@radix-ui/react-tabs'
import { cn } from '@/lib/utils'

interface TabItem {
  value: string
  label: string
  count?: number
}

interface TabNavProps {
  items: TabItem[]
  value: string
  onChange: (value: string) => void
  className?: string
}

export function TabNav({ items, value, onChange, className }: TabNavProps) {
  return (
    <Tabs.Root value={value} onValueChange={onChange}>
      <Tabs.List
        className={cn(
          'flex gap-1 overflow-x-auto border-b border-border pb-px',
          className,
        )}
      >
        {items.map((item) => (
          <Tabs.Trigger
            key={item.value}
            value={item.value}
            className={cn(
              'relative shrink-0 px-4 py-2.5 text-sm font-medium text-text-muted transition',
              'hover:text-text',
              'data-[state=active]:text-bach-blue',
              'after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-full',
              'after:scale-x-0 after:bg-bach-blue after:transition-transform',
              'data-[state=active]:after:scale-x-100',
            )}
          >
            {item.label}
            {item.count !== undefined && (
              <span className="ml-1.5 rounded-full bg-surface px-1.5 py-0.5 text-[10px] font-bold text-text-subtle">
                {item.count}
              </span>
            )}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
    </Tabs.Root>
  )
}
