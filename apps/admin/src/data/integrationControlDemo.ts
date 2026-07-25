/** Demo dataset for yonetim Entegrasyon Kontrol Merkezi (Super Admin). */

export type AdminIntegrationTenant = {
  id: string
  company: string
  plan: string
  founded: string
  lastLogin: string
  users: number
  totalMessages: number
  apiCalls: number
  aiUsage: string
  lastSync: string
  webhook: string
  platforms: Record<string, boolean>
  details: {
    platform: string
    title: string
    connected: boolean
    fields: { label: string; value: string }[]
  }[]
}

export const ADMIN_INTEGRATION_TENANTS: AdminIntegrationTenant[] = [
  {
    id: 'abc-mobilya',
    company: 'ABC Mobilya',
    plan: 'Enterprise',
    founded: '12.03.2024',
    lastLogin: '2 sa önce',
    users: 14,
    totalMessages: 15230,
    apiCalls: 88420,
    aiUsage: '42K token',
    lastSync: '2 dk önce',
    webhook: 'Aktif',
    platforms: {
      whatsapp: true,
      instagram: true,
      facebook: true,
      messenger: true,
      telegram: false,
      tiktok: false,
      linkedin: false,
      x: false,
      gmail: true,
      outlook: false,
    },
    details: [
      {
        platform: 'whatsapp',
        title: 'WhatsApp',
        connected: true,
        fields: [
          { label: 'Business ID', value: '1029384756' },
          { label: 'Phone Number ID', value: '10987654321' },
          { label: 'Business Name', value: 'ABC Mobilya' },
          { label: 'Token', value: '••••••••••••EAA3' },
          { label: 'Expire', value: '18.09.2026' },
          { label: 'Webhook', value: 'Aktif' },
          { label: 'Son Mesaj', value: '1 dk önce' },
          { label: 'Son Senkron', value: '2 dk önce' },
        ],
      },
      {
        platform: 'instagram',
        title: 'Instagram',
        connected: true,
        fields: [
          { label: 'Business Hesabı', value: '@abcmobilya' },
          { label: 'Takipçi', value: '12.4K' },
          { label: 'Bağlı Sayfa', value: 'ABC Mobilya' },
          { label: 'Token Expire', value: 'Yarın' },
        ],
      },
      {
        platform: 'facebook',
        title: 'Facebook',
        connected: true,
        fields: [
          { label: 'Sayfa Adı', value: 'ABC Mobilya' },
          { label: 'Page ID', value: '9876543210' },
          { label: 'Webhook', value: 'Aktif' },
        ],
      },
      {
        platform: 'gmail',
        title: 'Google',
        connected: true,
        fields: [
          { label: 'Mail', value: 'info@abcmobilya.com' },
          { label: 'Token', value: '••••••••••••ya29' },
          { label: 'Expire', value: '01.08.2026' },
        ],
      },
      {
        platform: 'outlook',
        title: 'Microsoft',
        connected: false,
        fields: [{ label: 'Durum', value: 'Bağlı değil' }],
      },
    ],
  },
  {
    id: 'demo-tekstil',
    company: 'Demo Tekstil',
    plan: 'Starter',
    founded: '01.01.2025',
    lastLogin: '1 gün önce',
    users: 3,
    totalMessages: 420,
    apiCalls: 2100,
    aiUsage: '1.2K token',
    lastSync: '1 sa önce',
    webhook: 'Hata',
    platforms: {
      whatsapp: true,
      instagram: false,
      facebook: false,
      messenger: false,
      telegram: false,
      tiktok: false,
      linkedin: false,
      x: false,
      gmail: false,
      outlook: true,
    },
    details: [
      {
        platform: 'whatsapp',
        title: 'WhatsApp',
        connected: true,
        fields: [
          { label: 'Business Name', value: 'Demo Tekstil' },
          { label: 'Webhook', value: 'Hata' },
          { label: 'Son Hata', value: 'Timeout 504' },
        ],
      },
      {
        platform: 'outlook',
        title: 'Microsoft',
        connected: true,
        fields: [
          { label: 'Mail', value: 'satis@demotekstil.com' },
          { label: 'Expire', value: '12.10.2026' },
        ],
      },
    ],
  },
  {
    id: 'nova-aydinlatma',
    company: 'Nova Aydınlatma',
    plan: 'Growth',
    founded: '22.06.2025',
    lastLogin: '5 dk önce',
    users: 8,
    totalMessages: 9100,
    apiCalls: 40100,
    aiUsage: '18K token',
    lastSync: 'Az önce',
    webhook: 'Aktif',
    platforms: {
      whatsapp: true,
      instagram: true,
      facebook: true,
      messenger: true,
      telegram: true,
      tiktok: true,
      linkedin: true,
      x: false,
      gmail: true,
      outlook: true,
    },
    details: [
      {
        platform: 'whatsapp',
        title: 'WhatsApp',
        connected: true,
        fields: [
          { label: 'Business Name', value: 'Nova Aydınlatma' },
          { label: 'Webhook', value: 'Aktif' },
        ],
      },
      {
        platform: 'instagram',
        title: 'Instagram',
        connected: true,
        fields: [
          { label: 'Business Hesabı', value: '@novaaydinlatma' },
          { label: 'Takipçi', value: '28K' },
        ],
      },
    ],
  },
]

export function getAdminIntegrationTenant(id: string) {
  return ADMIN_INTEGRATION_TENANTS.find((t) => t.id === id) || null
}

export function adminIntegrationOverview() {
  const firms = ADMIN_INTEGRATION_TENANTS
  return {
    totalFirms: firms.length,
    activeFirms: firms.filter((f) => f.webhook === 'Aktif').length,
    webhookActive: firms.filter((f) => f.webhook === 'Aktif').length,
    expiringSoon: 2,
    whatsappConnected: firms.filter((f) => f.platforms.whatsapp).length,
    oauthBroken: 1,
    webhookErrors: firms.filter((f) => f.webhook !== 'Aktif').length,
  }
}
