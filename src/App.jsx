import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { installAutoCapitalize } from './utils/autoCapitalize'
import { ensureUserProfile } from './utils/userProfile'
import Layout from './components/Layout/Layout'
import CashPage from './pages/CashPage'
import CustomerCreatePage from './pages/CustomerCreatePage'
import CustomerDetailPage from './pages/CustomerDetailPage'
import CustomerMovementDetailPage from './pages/CustomerMovementDetailPage'
import CustomerDocumentPage from './pages/CustomerDocumentPage'
import CustomersPage from './pages/CustomersPage'
import DashboardPage from './pages/DashboardPage'
import OrdersPage from './pages/OrdersPage'
import PersonnelPage from './pages/PersonnelPage'
import ProductionPage from './pages/ProductionPage'
import ProductionDetailPage from './pages/ProductionDetailPage'
import ProjectsPage from './pages/ProjectsPage'
import QuotesPage from './pages/QuotesPage'
import ShoppingPage from './pages/ShoppingPage'
import ProductsPage from './pages/stock/ProductsPage'
import WarehousesPage from './pages/stock/WarehousesPage'
import PlaceholderPage from './pages/stock/PlaceholderPage'
import DepoPage from './pages/process/DepoPage'
import DeliveredPage from './pages/process/DeliveredPage'
import SettingsPage from './pages/SettingsPage'
import LabelsSettingsPage from './pages/LabelsSettingsPage'
import CashBankSettingsPage from './pages/CashBankSettingsPage'
import ProfilePage from './pages/ProfilePage'
import AnnouncementsPage from './pages/AnnouncementsPage'
import AdminControlPage from './pages/AdminControlPage'
import CustomerPortalPage from './pages/portal/CustomerPortalPage'
import OmnichannelPage from './pages/OmnichannelPage'
import CrmPage from './pages/CrmPage'
import CrmTasksPage from './pages/CrmTasksPage'
import CrmAppointmentsPage from './pages/CrmAppointmentsPage'
import FieldSalesPage from './pages/FieldSalesPage'
import { stockSubMenus } from './data/stockMenu'

export default function App() {
  useEffect(() => {
    installAutoCapitalize()
    ensureUserProfile()
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/portal/:token" element={<CustomerPortalPage />} />
        <Route
          path="*"
          element={(
            <Layout>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/siparisler" element={<OrdersPage />} />
                <Route path="/uretim" element={<ProductionPage />} />
                <Route path="/uretim/:jobId" element={<ProductionDetailPage />} />
                <Route path="/musteriler" element={<CustomersPage />} />
                <Route path="/crm" element={<CrmPage />} />
                <Route path="/crm/gorevler" element={<CrmTasksPage />} />
                <Route path="/crm/randevular" element={<CrmAppointmentsPage />} />
                <Route path="/saha-satis" element={<FieldSalesPage />} />
                <Route path="/personel" element={<PersonnelPage />} />
                <Route path="/musteriler/yeni" element={<CustomerCreatePage />} />
                <Route path="/musteriler/:customerId/belge/:docType" element={<CustomerDocumentPage />} />
                <Route path="/musteriler/:customerId/hareket/:movementId" element={<CustomerMovementDetailPage />} />
                <Route path="/musteriler/:customerId" element={<CustomerDetailPage />} />
                <Route path="/teklifler" element={<QuotesPage />} />
                <Route path="/depo" element={<DepoPage />} />
                <Route path="/siparis-deposu" element={<Navigate to="/depo" replace />} />
                <Route path="/stok-deposu" element={<Navigate to="/depo" replace />} />
                <Route path="/teslim-edilenler" element={<DeliveredPage />} />
                <Route path="/kasa" element={<CashPage />} />
                <Route path="/shopping" element={<ShoppingPage />} />
                <Route path="/projeler/yeni" element={<ProjectsPage />} />
                <Route path="/ayarlar" element={<SettingsPage />} />
                <Route path="/ayarlar/kasa-banka" element={<CashBankSettingsPage />} />
                <Route path="/ayarlar/etiketler" element={<LabelsSettingsPage />} />
                <Route path="/profil" element={<ProfilePage />} />
                <Route path="/duyurular" element={<AnnouncementsPage />} />
                <Route path="/yonetici-kontrol" element={<AdminControlPage />} />
                <Route path="/mesajlar" element={<OmnichannelPage />} />
                <Route path="/whatsapp" element={<Navigate to="/mesajlar" replace />} />

                <Route path="/stok" element={<Navigate to="/stok/urunler" replace />} />
                <Route path="/stok/urunler" element={<ProductsPage />} />
                <Route path="/stok/depolar" element={<WarehousesPage />} />

                {stockSubMenus
                  .filter((item) => !['/stok/urunler', '/stok/depolar'].includes(item.path))
                  .map((item) => (
                    <Route
                      key={item.path}
                      path={item.path}
                      element={
                        <PlaceholderPage
                          title={item.label}
                          breadcrumb={item.label}
                        />
                      }
                    />
                  ))}
              </Routes>
            </Layout>
          )}
        />
      </Routes>
    </BrowserRouter>
  )
}
