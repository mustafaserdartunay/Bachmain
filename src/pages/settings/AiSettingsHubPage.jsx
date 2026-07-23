import { Link } from 'react-router-dom'
import { AppPageHeader, AppPagePanel, AppPageShell } from '../../components/Layout/AppPageLayout'
import { BTN_PRIMARY } from '../../utils/buttonStyles'

export default function AiSettingsHubPage() {
  return (
    <AppPageShell>
      <AppPageHeader title="AI Ayarları" backTo="/ayarlar" backLabel="Ayarlar" />
      <div className="grid gap-4 sm:grid-cols-2">
        <AppPagePanel title="OpenAI">
          <p className="mb-3 text-sm text-[var(--muted)]">
            API anahtarı, model seçimi, bağlantı testi ve token maliyeti.
          </p>
          <Link to="/ayarlar/ai/openai" className={`${BTN_PRIMARY} px-4 text-xs`}>
            OpenAI Ayarları
          </Link>
        </AppPagePanel>
        <AppPagePanel title="AI Growth Center">
          <p className="mb-3 text-sm text-[var(--muted)]">
            Marka tonu, sektör ve büyüme merkezi tercihleri.
          </p>
          <Link to="/ai-buyume/ayarlar" className={`${BTN_PRIMARY} px-4 text-xs`}>
            Growth Ayarları
          </Link>
        </AppPagePanel>
      </div>
    </AppPageShell>
  )
}
