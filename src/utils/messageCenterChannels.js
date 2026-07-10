export const MESSAGE_CENTER_CHANNEL_DEFINITIONS = [
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    api: 'WhatsApp Business Cloud API',
    fields: [
      { key: 'phoneNumberId', label: 'Phone Number ID', placeholder: 'Meta Phone Number ID' },
      { key: 'accessToken', label: 'Access Token', type: 'password', placeholder: 'EAA...' },
      { key: 'webhookVerifyToken', label: 'Webhook Verify Token', placeholder: 'Doğrulama anahtarı' },
    ],
  },
  {
    id: 'instagram',
    label: 'Instagram',
    api: 'Instagram Messaging API',
    fields: [
      { key: 'pageId', label: 'Instagram Business ID', placeholder: 'IG Business hesap ID' },
      { key: 'accessToken', label: 'Access Token', type: 'password', placeholder: 'EAA...' },
    ],
  },
  {
    id: 'facebook',
    label: 'Facebook',
    api: 'Facebook Messenger API',
    fields: [
      { key: 'pageId', label: 'Page ID', placeholder: 'Facebook Sayfa ID' },
      { key: 'accessToken', label: 'Access Token', type: 'password', placeholder: 'EAA...' },
    ],
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    api: 'TikTok Business Leads API',
    fields: [
      { key: 'advertiserId', label: 'Advertiser ID', placeholder: 'TikTok reklam hesabı ID' },
      { key: 'accessToken', label: 'Access Token', type: 'password', placeholder: 'TikTok API anahtarı' },
    ],
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    api: 'LinkedIn Messaging API',
    fields: [
      { key: 'organizationId', label: 'Organization ID', placeholder: 'LinkedIn şirket sayfası ID' },
      { key: 'clientId', label: 'Client ID', placeholder: 'LinkedIn uygulama Client ID' },
      { key: 'clientSecret', label: 'Client Secret', type: 'password', placeholder: 'LinkedIn Client Secret' },
      { key: 'accessToken', label: 'Access Token', type: 'password', placeholder: 'OAuth access token' },
    ],
  },
  {
    id: 'pinterest',
    label: 'Pinterest',
    api: 'Pinterest API',
    fields: [
      { key: 'adAccountId', label: 'Ad Account ID', placeholder: 'Pinterest reklam hesabı ID' },
      { key: 'appId', label: 'App ID', placeholder: 'Pinterest App ID' },
      { key: 'appSecret', label: 'App Secret', type: 'password', placeholder: 'Pinterest App Secret' },
      { key: 'accessToken', label: 'Access Token', type: 'password', placeholder: 'OAuth access token' },
    ],
  },
  {
    id: 'x',
    label: 'X',
    api: 'X (Twitter) API v2',
    fields: [
      { key: 'apiKey', label: 'API Key', placeholder: 'Consumer API Key' },
      { key: 'apiSecret', label: 'API Secret', type: 'password', placeholder: 'Consumer API Secret' },
      { key: 'accessToken', label: 'Access Token', type: 'password', placeholder: 'OAuth access token' },
      { key: 'accessTokenSecret', label: 'Access Token Secret', type: 'password', placeholder: 'OAuth token secret' },
    ],
  },
  {
    id: 'email',
    label: 'E-posta',
    api: 'IMAP / SMTP',
    fields: [
      { key: 'imapHost', label: 'IMAP Sunucu', placeholder: 'imap.ornek.com' },
      { key: 'imapPort', label: 'IMAP Port', placeholder: '993' },
      { key: 'smtpHost', label: 'SMTP Sunucu', placeholder: 'smtp.ornek.com' },
      { key: 'smtpPort', label: 'SMTP Port', placeholder: '587' },
      { key: 'username', label: 'E-posta Adresi', placeholder: 'info@firma.com' },
      { key: 'password', label: 'Şifre / Uygulama Şifresi', type: 'password', placeholder: '••••••••' },
    ],
  },
]

export function buildDefaultMessageCenterChannelConfig() {
  return Object.fromEntries(
    MESSAGE_CENTER_CHANNEL_DEFINITIONS.map((channel) => [
      channel.id,
      {
        connected: false,
        ...Object.fromEntries(channel.fields.map((field) => [field.key, ''])),
      },
    ]),
  )
}

export function mergeMessageCenterChannelConfig(saved = {}) {
  const defaults = buildDefaultMessageCenterChannelConfig()
  return Object.fromEntries(
    MESSAGE_CENTER_CHANNEL_DEFINITIONS.map((channel) => [
      channel.id,
      {
        ...defaults[channel.id],
        ...(saved[channel.id] || {}),
      },
    ]),
  )
}

export function getConnectedMessageCenterChannels(config = {}) {
  return MESSAGE_CENTER_CHANNEL_DEFINITIONS.filter((channel) => Boolean(config[channel.id]?.connected))
}
