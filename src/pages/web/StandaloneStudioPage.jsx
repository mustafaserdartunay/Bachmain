import { useState } from 'react'
import GiftStorefront from '../../storefront/GiftStorefront'
import GiftStorefrontDesigner from '../../storefront/GiftStorefrontDesigner'
import BrandLogo from '../../components/Layout/BrandLogo'
import '../../storefront/gift-storefront.css'

export default function StandaloneStudioPage() {
  const [selectedBlock, setSelectedBlock] = useState('hero')

  return (
    <div className="standalone-studio">
      <header className="standalone-studio-bar">
        <a
          href="https://bachmain.com/studio"
          className="standalone-studio-brand"
          aria-label="BACHMAIN Studio"
        >
          <BrandLogo />
          <span className="standalone-studio-badge">Studio</span>
        </a>
        <p className="standalone-studio-hint">
          Banner veya butonun üzerine gelin, tıklayın, sağdaki kartı uygulayın.
        </p>
        <a href="https://bachmain.com" className="standalone-studio-switch">
          BACHMAIN
        </a>
      </header>

      <div className="standalone-studio-body">
        <div className="standalone-studio-canvas">
          <GiftStorefront
            preview
            editable
            selectedBlock={selectedBlock}
            onSelectBlock={setSelectedBlock}
          />
        </div>
        <aside className="standalone-studio-rail">
          <GiftStorefrontDesigner selectedBlock={selectedBlock} onSelectBlock={setSelectedBlock} />
        </aside>
      </div>
    </div>
  )
}
