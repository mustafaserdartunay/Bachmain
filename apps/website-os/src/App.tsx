import { Navigate, Route, Routes } from 'react-router-dom'
import { SiteProvider } from '@/contexts/SiteContext'
import { WebsiteShell } from '@/components/layout/WebsiteShell'
import { DashboardPage } from '@/pages/DashboardPage'
import { SitesPage } from '@/pages/SitesPage'
import { BuilderPage } from '@/pages/BuilderPage'
import { PagesPage } from '@/pages/PagesPage'
import { DesignsPage } from '@/pages/DesignsPage'
import { TemplatesPage } from '@/pages/TemplatesPage'
import { MenuPage } from '@/pages/MenuPage'
import { MediaPage } from '@/pages/MediaPage'
import { ComingSoonPage } from '@/pages/ComingSoonPage'
import { SeoPage } from '@/pages/SeoPage'
import { DomainPage } from '@/pages/DomainPage'
import { AnalyticsPage } from '@/pages/AnalyticsPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { PackagePage } from '@/pages/PackagePage'
import { ContentPage } from '@/pages/ContentPage'
import { CollectionsPage } from '@/pages/CollectionsPage'
import { CollectionDetailPage } from '@/pages/CollectionDetailPage'

export function App() {
  return (
    <SiteProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/website/dashboard" replace />} />
        <Route path="/website" element={<Navigate to="/website/dashboard" replace />} />

        <Route element={<WebsiteShell />}>
          <Route path="/website/dashboard" element={<DashboardPage />} />
          <Route path="/website/sites" element={<SitesPage />} />
          <Route path="/website/builder" element={<BuilderPage />} />
          <Route path="/website/pages" element={<PagesPage />} />
          <Route path="/website/designs" element={<DesignsPage />} />
          <Route path="/website/templates" element={<TemplatesPage />} />
          <Route path="/website/menu" element={<MenuPage />} />
          <Route path="/website/media" element={<MediaPage />} />
          <Route path="/website/content" element={<ContentPage />} />
          <Route path="/website/collections" element={<CollectionsPage />} />
          <Route path="/website/collections/:collectionId" element={<CollectionDetailPage />} />
          <Route path="/website/blog" element={<ComingSoonPage title="Blog" description="Blog yazıları ve kategoriler." />} />
          <Route
            path="/website/products"
            element={<ComingSoonPage title="Ürünler" description="E-ticaret ürün kataloğu." />}
          />
          <Route
            path="/website/categories"
            element={<ComingSoonPage title="Kategoriler" description="Ürün kategorileri." />}
          />
          <Route
            path="/website/orders"
            element={<ComingSoonPage title="Siparişler" description="Sipariş yönetimi." />}
          />
          <Route
            path="/website/customers"
            element={<ComingSoonPage title="Müşteriler" description="Website müşteri listesi." />}
          />
          <Route
            path="/website/campaigns"
            element={<ComingSoonPage title="Kampanyalar" description="Pazarlama kampanyaları." />}
          />
          <Route path="/website/seo" element={<SeoPage />} />
          <Route path="/website/domains" element={<DomainPage />} />
          <Route path="/website/analytics" element={<AnalyticsPage />} />
          <Route path="/website/settings" element={<SettingsPage />} />
          <Route path="/website/package" element={<PackagePage />} />
          <Route
            path="/website/preview"
            element={<ComingSoonPage title="Preview" description="Canlı önizleme sonraki fazda." />}
          />
        </Route>

        <Route path="*" element={<Navigate to="/website/dashboard" replace />} />
      </Routes>
    </SiteProvider>
  )
}
