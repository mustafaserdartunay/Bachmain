import {
  FacebookIcon,
  InstagramIcon,
  LinkedInIcon,
  MailIcon,
  SOCIAL_BRAND_BACKGROUNDS,
  TikTokIcon,
  WhatsAppIcon,
  XIcon,
} from '../Layout/SocialBrandIcons'
import {
  Bot,
  Building2,
  CreditCard,
  Headphones,
  MessageCircle,
  Package,
  Sparkles,
  Store,
  Truck,
} from 'lucide-react'

const EXTRA_BG = {
  telegram: 'bg-[#26A5E4]',
  gmail: 'bg-[#EA4335]',
  outlook: 'bg-[#0078D4]',
  webchat: 'bg-[#0ea5e9]',
  live: 'bg-[#10b981]',
  messenger: 'bg-[#0084FF]',
  openai: 'bg-[#10A37F]',
  claude: 'bg-[#D97757]',
  gemini: 'bg-[#4285F4]',
  stripe: 'bg-[#635BFF]',
  shopify: 'bg-[#96BF48]',
  trendyol: 'bg-[#F27A1A]',
  default: 'bg-slate-700',
}

function TelegramGlyph({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#fff"
        d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"
      />
    </svg>
  )
}

export function IntegrationBrandIcon({ brandKey, className = 'h-5 w-5' }) {
  const map = {
    whatsapp: WhatsAppIcon,
    instagram: InstagramIcon,
    facebook: FacebookIcon,
    messenger: FacebookIcon,
    tiktok: TikTokIcon,
    linkedin: LinkedInIcon,
    x: XIcon,
    gmail: MailIcon,
    outlook: MailIcon,
    email: MailIcon,
    telegram: TelegramGlyph,
  }
  const Icon = map[brandKey]
  if (Icon) return <Icon className={className} />
  const Lucide =
    {
      webchat: MessageCircle,
      live: Headphones,
      openai: Sparkles,
      claude: Bot,
      gemini: Sparkles,
      stripe: CreditCard,
      shopify: Store,
      trendyol: Package,
      parasut: Building2,
      mng: Truck,
    }[brandKey] || Building2
  return <Lucide className={`${className} text-white`} strokeWidth={2} />
}

export function integrationBrandBg(brandKey) {
  return SOCIAL_BRAND_BACKGROUNDS[brandKey] || EXTRA_BG[brandKey] || EXTRA_BG.default
}
