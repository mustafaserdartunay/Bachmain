import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { QuickDock } from './QuickDock'
import { CommandPalette, useCommandPalette } from './CommandPalette'
import { SupportAlertProvider } from '@/hooks/useSupportAlertCount'

export function AppShell() {
  const { open, setOpen } = useCommandPalette()

  return (
    <SupportAlertProvider>
      <div className="flex h-screen overflow-hidden app-gradient">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Header onOpenCommand={() => setOpen(true)} />
          <div className="flex min-h-0 flex-1">
            <main className="min-w-0 flex-1 overflow-y-auto p-4 lg:p-6" id="main-content" tabIndex={-1}>
              <Outlet />
            </main>
            <QuickDock />
          </div>
        </div>
        <CommandPalette open={open} onOpenChange={setOpen} />
      </div>
    </SupportAlertProvider>
  )
}
