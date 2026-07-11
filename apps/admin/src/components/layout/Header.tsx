import { Search, Grid3X3, Bell, Sun, Moon, ChevronDown } from 'lucide-react'
import { Link } from 'react-router-dom'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import * as Avatar from '@radix-ui/react-avatar'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/lib/utils'

export function Header({ onOpenCommand }: { onOpenCommand: () => void }) {
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-surface-elevated/80 px-4 backdrop-blur-xl">
      <div className="relative max-w-xl flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle" aria-hidden />
        <Input
          placeholder="Ara... (⌘K)"
          className="h-9 border-transparent bg-surface pl-9 focus:border-border"
          onFocus={onOpenCommand}
          readOnly
          aria-label="Arama"
        />
      </div>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" aria-label="Komut Paleti" onClick={onOpenCommand}>
          <Grid3X3 className="h-4 w-4" />
        </Button>

        <Link to="/bildirimler">
          <Button variant="ghost" size="icon" className="relative" aria-label="Bildirimler">
            <Bell className="h-4 w-4" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500" />
          </Button>
        </Link>

        <div className="mx-1 hidden h-6 w-px bg-border sm:block" />

        <div className="hidden items-center rounded-lg border border-border p-0.5 sm:flex" role="group" aria-label="Tema">
          <button
            type="button"
            onClick={() => theme !== 'light' && toggleTheme()}
            className={cn(
              'flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition',
              theme === 'light' ? 'bg-surface-elevated text-text shadow-sm' : 'text-text-muted',
            )}
            aria-pressed={theme === 'light'}
          >
            <Sun className="h-3.5 w-3.5" /> Gündüz
          </button>
          <button
            type="button"
            onClick={() => theme !== 'dark' && toggleTheme()}
            className={cn(
              'flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition',
              theme === 'dark' ? 'bg-surface-elevated text-text shadow-sm' : 'text-text-muted',
            )}
            aria-pressed={theme === 'dark'}
          >
            <Moon className="h-3.5 w-3.5" /> Gece
          </button>
        </div>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              className="ml-1 flex items-center gap-2 rounded-lg px-2 py-1.5 transition hover:bg-black/5 dark:hover:bg-white/5"
              aria-label="Kullanıcı menüsü"
            >
              <Avatar.Root className="flex h-8 w-8 items-center justify-center rounded-full bg-bach-blue text-xs font-bold text-white">
                <Avatar.Fallback>ST</Avatar.Fallback>
              </Avatar.Root>
              <div className="hidden text-left lg:block">
                <p className="text-xs font-semibold text-text">Serdar T.</p>
                <p className="text-[10px] text-text-subtle">Super Admin</p>
              </div>
              <ChevronDown className="hidden h-3.5 w-3.5 text-text-subtle lg:block" />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="z-50 min-w-[180px] rounded-xl border border-border bg-surface-elevated p-1 shadow-xl"
              sideOffset={8}
              align="end"
            >
              <DropdownMenu.Item className="cursor-pointer rounded-lg px-3 py-2 text-sm outline-none hover:bg-black/5 dark:hover:bg-white/5">
                Profil
              </DropdownMenu.Item>
              <DropdownMenu.Item className="cursor-pointer rounded-lg px-3 py-2 text-sm outline-none hover:bg-black/5 dark:hover:bg-white/5" asChild>
                <Link to="/ayarlar">Ayarlar</Link>
              </DropdownMenu.Item>
              <DropdownMenu.Separator className="my-1 h-px bg-border" />
              <DropdownMenu.Item className="cursor-pointer rounded-lg px-3 py-2 text-sm text-rose-600 outline-none hover:bg-rose-50 dark:hover:bg-rose-950/30">
                Çıkış
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  )
}
