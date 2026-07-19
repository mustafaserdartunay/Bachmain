import AiGrowthGenerateStudio from '../../components/AiGrowth/AiGrowthGenerateStudio'
import { AI_GROWTH_STUDIO_CONFIGS } from './studioConfigs'

export function makeStudioPage(configKey) {
  const config = AI_GROWTH_STUDIO_CONFIGS[configKey]
  return function StudioPage() {
    return <AiGrowthGenerateStudio config={config} />
  }
}

export const AiContentCenterPage = makeStudioPage('content')
export const AiSocialStudioPage = makeStudioPage('social')
export const AiBlogCenterPage = makeStudioPage('blog')
export const AiSeoCenterPage = makeStudioPage('seo')
export const AiAdsCenterPage = makeStudioPage('ads')
export const AiVideoCenterPage = makeStudioPage('video')
export const AiEmailMarketingPage = makeStudioPage('email')
export const AiWhatsappCampaignsPage = makeStudioPage('whatsapp')
export const AiLandingPageStudioPage = makeStudioPage('landing')
export const AiCompetitorAnalysisPage = makeStudioPage('competitor')
export const AiTrendAnalysisPage = makeStudioPage('trend')
export const AiKeywordCenterPage = makeStudioPage('keywords')
export const AiDesignStudioPage = makeStudioPage('design')
export const AiVisualStudioPage = makeStudioPage('visual')
export const AiBannerStudioPage = makeStudioPage('banner')
export const AiProductPhotoPage = makeStudioPage('productPhoto')
export const AiVideoScriptPage = makeStudioPage('videoScript')
