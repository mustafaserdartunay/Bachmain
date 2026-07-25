import IntegrationCenterPage from '../IntegrationCenterPage'

/** Social Message Center → Bağlantılar (messaging / social / email channels). */
export default function SocialConnectionsPage() {
  return (
    <IntegrationCenterPage
      title="Bağlantılar"
      subtitle="WhatsApp, Instagram, Messenger ve diğer kanalları API anahtarı olmadan bağlayın."
      backTo="/sosyal-medya"
      backLabel="Social Media"
      platformsFilter={(p) => Boolean(p.socialMessage)}
    />
  )
}
