import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom'
import { installAutoCapitalize } from './utils/autoCapitalize'
import { cleanupDemoDataOnce } from './utils/demoDataCleanup'
import { AuthProvider, useAuth } from './auth/AuthContext'
import { OrgProvider } from './org/OrgContext'
import RequireAuth from './auth/RequireAuth'
import { LoginPage, RegisterPage } from './pages/auth/AuthPages'
import LicensePage from './pages/auth/LicensePage'
import TrialExpiredPage from './pages/auth/TrialExpiredPage'
import OnboardingWizard from './pages/onboarding/OnboardingWizard'
import Layout from './components/Layout/Layout'
import CashPage from './pages/CashPage'
import ChequesPage from './pages/treasury/ChequesPage'
import CashBankReportPage from './pages/treasury/CashBankReportPage'
import CashFlowReportPage from './pages/treasury/CashFlowReportPage'
import { CASH_BASE_PATH } from './data/treasuryMenu'
import CustomerCreatePage from './pages/CustomerCreatePage'
import CustomerDetailPage from './pages/CustomerDetailPage'
import CustomerMovementDetailPage from './pages/CustomerMovementDetailPage'
import CustomerDocumentPage from './pages/CustomerDocumentPage'
import CustomerFinderPage from './pages/CustomerFinderPage'
import CustomersPage from './pages/CustomersPage'
import SuppliersPage from './pages/SuppliersPage'
import SalesInvoicesPage from './pages/SalesInvoicesPage'
import SalesReportPage from './pages/SalesReportPage'
import CollectionsReportPage from './pages/CollectionsReportPage'
import IncomeExpenseReportPage from './pages/IncomeExpenseReportPage'
import ExpenseListPage from './pages/expenses/ExpenseListPage'
import LoanPaymentsPage from './pages/expenses/LoanPaymentsPage'
import IncomingEInvoicesPage from './pages/expenses/IncomingEInvoicesPage'
import ExpensesReportPage from './pages/expenses/ExpensesReportPage'
import PaymentsReportPage from './pages/expenses/PaymentsReportPage'
import VatReportPage from './pages/expenses/VatReportPage'
import DashboardPage from './pages/DashboardPage'
import OrdersPage from './pages/OrdersPage'
import PersonnelPage from './pages/PersonnelPage'
import ProductionPage from './pages/ProductionPage'
import ProductionCreatePage from './pages/ProductionCreatePage'
import ProductionDetailPage from './pages/ProductionDetailPage'
import ProjectsPage from './pages/ProjectsPage'
import QuotesPage from './pages/QuotesPage'
import ShoppingPage from './pages/ShoppingPage'
import ProductsPage from './pages/stock/ProductsPage'
import WarehousesPage from './pages/stock/WarehousesPage'
import WarehouseTransferPage from './pages/stock/WarehouseTransferPage'
import OutgoingWaybillPage from './pages/stock/OutgoingWaybillPage'
import IncomingWaybillPage from './pages/stock/IncomingWaybillPage'
import PriceListsPage from './pages/stock/PriceListsPage'
import StockHistoryPage from './pages/stock/StockHistoryPage'
import StockProductsReportPage from './pages/stock/StockProductsReportPage'
import CostCalculatorRoute, { LegacyCostCalculatorRedirect } from './pages/stock/CostCalculatorRoute'
import DepoPage from './pages/process/DepoPage'
import DeliveredPage from './pages/process/DeliveredPage'
import MessageCenterSettingsPage from './pages/MessageCenterSettingsPage'
import SettingsPage from './pages/SettingsPage'
import {
  OrgHubPage,
  OrgCompaniesPage,
  OrgBranchesPage,
  OrgWarehousesPage,
  OrgDepartmentsPage,
  OrgUserPermissionsPage,
  OrgCompanySettingsPage,
} from './pages/org/OrgStructurePages'
import LabelsSettingsPage from './pages/LabelsSettingsPage'
import TagLabelsSettingsPage from './pages/TagLabelsSettingsPage'
import CashBankSettingsPage from './pages/CashBankSettingsPage'
import ProfilePage from './pages/ProfilePage'
import { MyPlanPage, BuyPlanPage, CheckoutPage } from './pages/billing/BillingPages'
import PackagesPage from './pages/billing/PackagesPage'
import AnnouncementsPage from './pages/AnnouncementsPage'
import TrainingPage from './pages/TrainingPage'
import AdminControlPage from './pages/AdminControlPage'
import CustomerPortalPage from './pages/portal/CustomerPortalPage'
import OmnichannelPage from './pages/OmnichannelPage'
import CrmPage from './pages/CrmPage'
import CrmCreatePage from './pages/CrmCreatePage'
import CrmTasksPage from './pages/CrmTasksPage'
import CrmAppointmentsPage from './pages/CrmAppointmentsPage'
import FieldSalesPage from './pages/FieldSalesPage'
import PdksDashboardPage from './pages/hr/PdksDashboardPage'
import AttendanceTrackingPage from './pages/hr/AttendanceTrackingPage'
import ShiftsPage from './pages/hr/ShiftsPage'
import LeavesPage from './pages/hr/LeavesPage'
import OvertimePage from './pages/hr/OvertimePage'
import AbsencesPage from './pages/hr/AbsencesPage'
import TaskTrackingPage from './pages/hr/TaskTrackingPage'
import MapTrackingPage from './pages/hr/MapTrackingPage'
import MobileCheckInPage from './pages/hr/MobileCheckInPage'
import PdksSettingsPage from './pages/hr/PdksSettingsPage'
import SalesRepresentativesPage from './pages/fieldSales/SalesRepresentativesPage'
import SalesRepReportsPage from './pages/fieldSales/SalesRepReportsPage'
import CourierTrackingPage from './pages/CourierTrackingPage'
import CustomerCourierTrackingPage from './pages/portal/CustomerCourierTrackingPage'
import SectoralSettingsPage from './pages/SectoralSettingsPage'
import SectoralCategorySettingsPage from './pages/SectoralCategorySettingsPage'
import GuncelDurumSettingsPage from './pages/GuncelDurumSettingsPage'
import TaxVatSettingsPage from './pages/TaxVatSettingsPage'
import DocumentCenterPage from './pages/documentCenter/DocumentCenterPage'
import DocTemplatesPage from './pages/documentCenter/DocTemplatesPage'
import DocTemplateDesignerPage from './pages/documentCenter/DocTemplateDesignerPage'
import DocLabelDesignerPage from './pages/documentCenter/DocLabelDesignerPage'
import DocPrintPage from './pages/documentCenter/DocPrintPage'
import DocPrintJobsPage from './pages/documentCenter/DocPrintJobsPage'
import DocPrintProfilesPage from './pages/documentCenter/DocPrintProfilesPage'
import {
  DocArchivePage,
  DocAssetsPage,
  DocBarcodeDesignerPage,
  DocComponentsPage,
  DocEmailTemplatesPage,
  DocFontsPage,
  DocMarketplacePage,
  DocPdfDesignerPage,
  DocPermissionsPage,
  DocQrDesignerPage,
  DocThemesPage,
  DocVariablesPage,
  DocVersionsPage,
  DocWhatsAppTemplatesPage,
  DocWorkflowPage,
} from './pages/documentCenter/DocCenterModules'

function LegacyKasaAccountRedirect() {
  const { accountId } = useParams()
  return <Navigate to={`${CASH_BASE_PATH}/${accountId}`} replace />
}

function OnboardingWizardRoute() {
  const { completeOnboarding } = useAuth()
  return <OnboardingWizard onComplete={() => completeOnboarding()} />
}

export default function App() {
  useEffect(() => {
    cleanupDemoDataOnce()
    installAutoCapitalize()
  }, [])

  return (
    <AuthProvider>
      <OrgProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/giris" element={<LoginPage />} />
          <Route path="/kayit" element={<RegisterPage />} />
          <Route path="/hesap/lisans" element={<LicensePage />} />
          <Route
            path="/deneme-bitti"
            element={(
              <RequireAuth>
                <TrialExpiredPage />
              </RequireAuth>
            )}
          />
          <Route
            path="/kurulum"
            element={(
              <RequireAuth>
                <OnboardingWizardRoute />
              </RequireAuth>
            )}
          />
          <Route path="/portal/:token" element={<CustomerPortalPage />} />
          <Route path="/kurye-takip/:trackingToken" element={<CustomerCourierTrackingPage />} />
          <Route
            path="*"
            element={(
              <RequireAuth>
                <Layout>
                  <Routes>
                    <Route path="/" element={<DashboardPage />} />
                <Route path="/siparisler" element={<OrdersPage />} />
                <Route path="/uretim" element={<ProductionPage />} />
                <Route path="/uretim/yeni" element={<ProductionCreatePage />} />
                <Route path="/uretim/:jobId" element={<ProductionDetailPage />} />
                <Route path="/musteriler/faturalar" element={<SalesInvoicesPage />} />
                <Route path="/musteriler/satis-raporu" element={<SalesReportPage />} />
                <Route path="/musteriler/tahsilat-raporu" element={<CollectionsReportPage />} />
                <Route path="/musteriler/gelir-gider-raporu" element={<IncomeExpenseReportPage />} />
                <Route path="/giderler/liste" element={<ExpenseListPage />} />
                <Route path="/giderler/kredi-odemeleri" element={<LoanPaymentsPage />} />
                <Route path="/giderler/gelen-e-faturalar" element={<IncomingEInvoicesPage />} />
                <Route path="/giderler/tedarikciler" element={<SuppliersPage />} />
                <Route path="/ik" element={<PdksDashboardPage />} />
                <Route path="/ik/personeller" element={<PersonnelPage />} />
                <Route path="/ik/giris-cikis" element={<AttendanceTrackingPage />} />
                <Route path="/ik/vardiyalar" element={<ShiftsPage />} />
                <Route path="/ik/izinler" element={<LeavesPage />} />
                <Route path="/ik/mesailer" element={<OvertimePage />} />
                <Route path="/ik/devamsizliklar" element={<AbsencesPage />} />
                <Route path="/ik/gorevler" element={<TaskTrackingPage />} />
                <Route path="/ik/harita" element={<MapTrackingPage />} />
                <Route path="/ik/mobil" element={<MobileCheckInPage />} />
                <Route path="/ik/ayarlar" element={<PdksSettingsPage />} />
                <Route path="/personel" element={<Navigate to="/ik/personeller" replace />} />
                <Route path="/giderler/calisanlar" element={<Navigate to="/ik/personeller" replace />} />
                <Route path="/giderler/giderler-raporu" element={<ExpensesReportPage />} />
                <Route path="/giderler/odemeler-raporu" element={<PaymentsReportPage />} />
                <Route path="/giderler/kdv-raporu" element={<VatReportPage />} />
                <Route path="/giderler" element={<Navigate to="/giderler/liste" replace />} />
                <Route path="/musteriler" element={<CustomersPage listKind="customer" />} />
                <Route path="/musteri-bul" element={<CustomerFinderPage />} />
                <Route path="/suppliers" element={<Navigate to="/giderler/tedarikciler" replace />} />
                <Route path="/crm" element={<CrmPage />} />
                <Route path="/crm/gorev-yeni" element={<CrmCreatePage type="task" />} />
                <Route path="/crm/randevu-yeni" element={<CrmCreatePage type="appointment" />} />
                <Route path="/crm/not-yeni" element={<CrmCreatePage type="note" />} />
                <Route path="/crm/gorev/:id/duzenle" element={<CrmCreatePage type="task" />} />
                <Route path="/crm/randevu/:id/duzenle" element={<CrmCreatePage type="appointment" />} />
                <Route path="/crm/not/:id/duzenle" element={<CrmCreatePage type="note" />} />
                <Route path="/crm/gorevler" element={<CrmTasksPage />} />
                <Route path="/crm/randevular" element={<CrmAppointmentsPage />} />
                <Route path="/saha-satis" element={<FieldSalesPage />} />
                <Route path="/saha-satis/temsilciler" element={<SalesRepresentativesPage />} />
                <Route path="/saha-satis/temsilci-raporlari" element={<SalesRepReportsPage />} />
                <Route path="/musteriler/yeni" element={<CustomerCreatePage />} />
                <Route path="/musteriler/:customerId/belge/:docType" element={<CustomerDocumentPage />} />
                <Route path="/musteriler/:customerId/hareket/:movementId" element={<CustomerMovementDetailPage />} />
                <Route path="/musteriler/:customerId" element={<CustomerDetailPage />} />
                <Route path="/teklifler" element={<QuotesPage />} />
                <Route path="/belge-merkezi" element={<DocumentCenterPage />} />
                <Route path="/belge-merkezi/sablonlar" element={<DocTemplatesPage />} />
                <Route path="/belge-merkezi/tasarimci" element={<DocTemplateDesignerPage />} />
                <Route path="/belge-merkezi/etiket" element={<DocLabelDesignerPage />} />
                <Route path="/belge-merkezi/barkod" element={<DocBarcodeDesignerPage />} />
                <Route path="/belge-merkezi/qr" element={<DocQrDesignerPage />} />
                <Route path="/belge-merkezi/pdf" element={<DocPdfDesignerPage />} />
                <Route path="/belge-merkezi/eposta" element={<DocEmailTemplatesPage />} />
                <Route path="/belge-merkezi/whatsapp" element={<DocWhatsAppTemplatesPage />} />
                <Route path="/belge-merkezi/yazici-profilleri" element={<DocPrintProfilesPage />} />
                <Route path="/belge-merkezi/degiskenler" element={<DocVariablesPage />} />
                <Route path="/belge-merkezi/bilesenler" element={<DocComponentsPage />} />
                <Route path="/belge-merkezi/assets" element={<DocAssetsPage />} />
                <Route path="/belge-merkezi/fonts" element={<DocFontsPage />} />
                <Route path="/belge-merkezi/temalar" element={<DocThemesPage />} />
                <Route path="/belge-merkezi/workflow" element={<DocWorkflowPage />} />
                <Route path="/belge-merkezi/izinler" element={<DocPermissionsPage />} />
                <Route path="/belge-merkezi/marketplace" element={<DocMarketplacePage />} />
                <Route path="/belge-merkezi/versiyonlar" element={<DocVersionsPage />} />
                <Route path="/belge-merkezi/arsiv" element={<DocArchivePage />} />
                <Route path="/belge-merkezi/yazdir" element={<DocPrintPage />} />
                <Route path="/belge-merkezi/kayitlar" element={<DocPrintJobsPage />} />
                <Route path="/depo" element={<DepoPage />} />
                <Route path="/siparis-deposu" element={<Navigate to="/depo" replace />} />
                <Route path="/stok-deposu" element={<Navigate to="/depo" replace />} />
                <Route path="/teslim-edilenler" element={<DeliveredPage />} />
                <Route path={CASH_BASE_PATH} element={<CashPage />} />
                <Route path={`${CASH_BASE_PATH}/:accountId`} element={<CashPage />} />
                <Route path="/nakit/cekler" element={<ChequesPage />} />
                <Route path="/nakit/kasa-banka-raporu" element={<CashBankReportPage />} />
                <Route path="/nakit/nakit-akisi-raporu" element={<CashFlowReportPage />} />
                <Route path="/nakit" element={<Navigate to={CASH_BASE_PATH} replace />} />
                <Route path="/kasa" element={<Navigate to={CASH_BASE_PATH} replace />} />
                <Route path="/kasa/:accountId" element={<LegacyKasaAccountRedirect />} />
                <Route path="/shopping" element={<ShoppingPage />} />
                <Route path="/projeler/yeni" element={<ProjectsPage />} />
                <Route path="/ayarlar" element={<SettingsPage />} />
                <Route path="/ayarlar/guncel-durum" element={<GuncelDurumSettingsPage />} />
                <Route path="/ayarlar/mesaj-merkezi" element={<MessageCenterSettingsPage />} />
                <Route path="/ayarlar/vergi-kdv" element={<TaxVatSettingsPage />} />
                <Route path="/ayarlar/kasa-banka" element={<CashBankSettingsPage />} />
                <Route path="/ayarlar/etiketler" element={<LabelsSettingsPage />} />
                <Route path="/ayarlar/etiket-listesi" element={<TagLabelsSettingsPage />} />
                <Route path="/ayarlar/sektorel" element={<SectoralSettingsPage />} />
                <Route path="/ayarlar/sektorel/:categoryId" element={<SectoralCategorySettingsPage />} />
                <Route path="/ayarlar/kurumsal-yapi" element={<OrgHubPage />} />
                <Route path="/ayarlar/kurumsal-yapi/sirketler" element={<OrgCompaniesPage />} />
                <Route path="/ayarlar/kurumsal-yapi/subeler" element={<OrgBranchesPage />} />
                <Route path="/ayarlar/kurumsal-yapi/depolar" element={<OrgWarehousesPage />} />
                <Route path="/ayarlar/kurumsal-yapi/departmanlar" element={<OrgDepartmentsPage />} />
                <Route path="/ayarlar/kurumsal-yapi/kullanici-yetkileri" element={<OrgUserPermissionsPage />} />
                <Route path="/ayarlar/kurumsal-yapi/sirket-ayarlari" element={<OrgCompanySettingsPage />} />
                <Route path="/profil" element={<ProfilePage />} />
                <Route path="/paketler" element={<PackagesPage />} />
                <Route path="/profil/paketim" element={<MyPlanPage />} />
                <Route path="/profil/paket-satin-al" element={<BuyPlanPage />} />
                <Route path="/profil/odeme" element={<CheckoutPage />} />
                <Route path="/duyurular" element={<AnnouncementsPage />} />
                <Route path="/egitim" element={<TrainingPage />} />
                <Route path="/yonetici-kontrol" element={<AdminControlPage />} />
                <Route path="/mesajlar" element={<OmnichannelPage />} />
                <Route path="/whatsapp" element={<Navigate to="/mesajlar" replace />} />

                <Route path="/stok" element={<Navigate to="/stok/urunler" replace />} />
                <Route path="/stok/urunler" element={<ProductsPage />} />
                <Route
                  path="/stok/baklava-kutu-maliyet-hesaplama"
                  element={<CostCalculatorRoute variant="baklava" moduleId="baklavaCostCalculator" />}
                />
                <Route path="/stok/urun-maliyet-hesaplama" element={<LegacyCostCalculatorRedirect />} />
                <Route path="/stok/pasta-kutu-maliyet-hesaplama" element={<LegacyCostCalculatorRedirect />} />
                <Route path="/stok/depolar" element={<WarehousesPage />} />
                <Route path="/stok/depolar-arasi-transfer" element={<WarehouseTransferPage />} />
                <Route path="/stok/giden-irsaliye" element={<OutgoingWaybillPage />} />
                <Route path="/stok/gelen-irsaliye" element={<IncomingWaybillPage />} />
                <Route path="/stok/fiyat-listeleri" element={<PriceListsPage />} />
                <Route path="/stok/stok-gecmisi" element={<StockHistoryPage />} />
                <Route path="/stok/stoktaki-urunler-raporu" element={<StockProductsReportPage />} />
              </Routes>
                </Layout>
              </RequireAuth>
            )}
          />
        </Routes>
      </BrowserRouter>
      </OrgProvider>
    </AuthProvider>
  )
}
