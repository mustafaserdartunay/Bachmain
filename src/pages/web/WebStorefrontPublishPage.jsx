import GiftStorefront from '../../storefront/GiftStorefront'
import { getWebTemplate } from '../../utils/webTemplateStorage'

export default function WebStorefrontPublishPage() {
  const tpl = getWebTemplate()
  if (!tpl.selected) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#fcfaf7] px-6 text-center">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#c9ad8a]">Vitrin</p>
          <h1 className="mt-3 text-3xl font-extrabold text-[#1f3f66]">Şablon henüz seçilmedi</h1>
          <p className="mt-2 text-sm text-[#1f3f66]/65">Studio Yönetim → Template üzerinden şablonu yayınlayın.</p>
        </div>
      </div>
    )
  }
  return <GiftStorefront />
}
