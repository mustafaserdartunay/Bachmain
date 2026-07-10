import { AppPageHeader, AppPagePanel, AppPageShell } from '../components/Layout/AppPageLayout'
import MessageCenterSettingsPanel from '../components/Settings/MessageCenterSettingsPanel'

export default function MessageCenterSettingsPage() {
  return (
    <AppPageShell>
      <AppPageHeader title="Mesaj Merkezi Yönetimi" />

      <AppPagePanel
        title="Kanal Bağlantıları"
        description="WhatsApp, Instagram, Facebook, TikTok, LinkedIn, Pinterest, X ve e-posta kanallarını tek tek bağlayın."
        dotColor="blue"
      >
        <MessageCenterSettingsPanel />
      </AppPagePanel>
    </AppPageShell>
  )
}
