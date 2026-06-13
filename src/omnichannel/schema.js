export const CHANNELS = {
  whatsapp: {
    id: 'whatsapp',
    label: 'WhatsApp',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-500/30',
    api: 'WhatsApp Business Cloud API',
  },
  instagram: {
    id: 'instagram',
    label: 'Instagram',
    color: 'text-pink-400',
    bg: 'bg-pink-500/15',
    border: 'border-pink-500/30',
    api: 'Instagram Messaging API',
  },
  facebook: {
    id: 'facebook',
    label: 'Messenger',
    color: 'text-blue-400',
    bg: 'bg-blue-500/15',
    border: 'border-blue-500/30',
    api: 'Facebook Messenger API',
  },
  email: {
    id: 'email',
    label: 'E-posta',
    color: 'text-amber-400',
    bg: 'bg-amber-500/15',
    border: 'border-amber-500/30',
    api: 'IMAP/SMTP',
  },
  tiktok: {
    id: 'tiktok',
    label: 'TikTok Leads',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/15',
    border: 'border-cyan-500/30',
    api: 'TikTok Business Leads',
  },
}

export const MESSAGE_TYPES = ['text', 'image', 'file', 'audio', 'video']

export const DEPARTMENTS = [
  { id: 'dep-sales', name: 'Satış', channels: ['whatsapp', 'instagram', 'facebook', 'tiktok'], defaultAssignee: 'Serdar Tünay' },
  { id: 'dep-support', name: 'Destek', channels: ['whatsapp', 'email', 'facebook'], defaultAssignee: 'Ayşe Demir' },
  { id: 'dep-finance', name: 'Finans', channels: ['email'], defaultAssignee: 'Mehmet Kaya' },
]

export const STORAGE_KEYS = {
  conversations: 'bach-omni-conversations',
  messages: 'bach-omni-messages',
  leads: 'bach-omni-leads',
  channelConfig: 'bach-omni-channel-config',
  webhookLog: 'bach-omni-webhook-log',
  assignments: 'bach-omni-assignments',
}
