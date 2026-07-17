import { AppPageHeader, AppPageShell } from '../components/Layout/AppPageLayout'
import DashboardLayoutSettingsPanel from '../components/Settings/DashboardLayoutSettingsPanel'

export default function GuncelDurumSettingsPage() {
  return (
    <AppPageShell>
      <AppPageHeader title="Güncel Durum" />
      <DashboardLayoutSettingsPanel />
    </AppPageShell>
  )
}
