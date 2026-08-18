import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom'
import { installAutoCapitalize } from './utils/autoCapitalize'
import { installFormSubmitGuard } from './utils/formSubmitGuard'
import { cleanupDemoDataOnce } from './utils/demoDataCleanup'
import { installAppUpdateChecker } from './version/updateChecker'
import { AuthProvider, useAuth } from './auth/AuthContext'
import { OrgProvider } from './org/OrgContext'
import RequireAuth from './auth/RequireAuth'
import {
  LoginPage,
  RegisterPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  VerifyEmailPage,
} from './pages/auth/AuthPages'
import LicensePage from './pages/auth/LicensePage'
import TrialExpiredPage from './pages/auth/TrialExpiredPage'
import OnboardingWizard from './pages/onboarding/OnboardingWizard'
import Layout from './components/Layout/Layout'
import { lazyPage, PageSuspense } from './components/Common/PageSuspense'
import CashPage from './pages/CashPage'
import ChequesPage from './pages/treasury/ChequesPage'
import PromissoryNotesPage from './pages/treasury/PromissoryNotesPage'
import TreasuryAccountsListPage from './pages/treasury/TreasuryAccountsListPage'
import TreasuryTypeReportPage from './pages/treasury/TreasuryTypeReportPage'
import CashBankReportPage from './pages/treasury/CashBankReportPage'
import CashFlowReportPage from './pages/treasury/CashFlowReportPage'
import { CASH_BASE_PATH, TREASURY_REPORTS_PATH } from './data/treasuryMenu'
import CustomerCreatePage from './pages/CustomerCreatePage'
import MasterDataHubPage from './pages/MasterDataHubPage'
import WorkflowHubPage from './pages/WorkflowHubPage'
import AiosHubPage from './pages/AiosHubPage'
import BachySettingsPage from './pages/BachySettingsPage'
import AiEnterpriseOrgPage from './pages/AiEnterpriseOrgPage'
import AiAutonomousCompanyPage from './pages/AiAutonomousCompanyPage'
import AiAppBuilderPage from './pages/AiAppBuilderPage'
import KnowledgeCenterPage from './pages/KnowledgeCenterPage'
import DigitalTwinCenterPage from './pages/DigitalTwinCenterPage'
import ManufacturingCenterPage from './pages/mes/ManufacturingCenterPage'
import MesOperatorTabletPage from './pages/mes/MesOperatorTabletPage'
import FinanceCenterPage from './pages/FinanceCenterPage'
import AnalyticsCenterPage from './pages/AnalyticsCenterPage'
import CustomerExperienceCloudPage from './pages/CustomerExperienceCloudPage'
import CustomerDetailPage from './pages/CustomerDetailPage'
import CustomerLoadShipmentCreatePage from './pages/CustomerLoadShipmentCreatePage'
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
import IncomingEInvoiceDetailPage from './pages/expenses/IncomingEInvoiceDetailPage'
import ExpensesReportPage from './pages/expenses/ExpensesReportPage'
import PaymentsReportPage from './pages/expenses/PaymentsReportPage'
import VatReportPage from './pages/expenses/VatReportPage'
import DashboardPage from './pages/DashboardPage'
import PersonnelPage from './pages/PersonnelPage'
import ProductionCreatePage from './pages/ProductionCreatePage'
import ProductionDetailPage from './pages/ProductionDetailPage'
import ProjectsPage from './pages/ProjectsPage'
import ProjectsListPage from './pages/ProjectsListPage'
import ShoppingPage from './pages/ShoppingPage'

const QuotesPage = lazyPage(() => import('./pages/QuotesPage'))
const OrdersPage = lazyPage(() => import('./pages/OrdersPage'))
const ProductionPage = lazyPage(() => import('./pages/ProductionPage'))
const DepoPageLazy = lazyPage(() => import('./pages/process/DepoPage'))
const SevkiyatPageLazy = lazyPage(() => import('./pages/process/SevkiyatPage'))
const WorkflowDesignerPage = lazyPage(() => import('./pages/WorkflowDesignerPage'))
const TruckLoadCalculatorPage = lazyPage(() => import('./components/Logistics/TruckLoadCalculator'))
const LogisticsDashboardPage = lazyPage(() =>
  import('./pages/logistics/LogisticsFlowPages').then((m) => ({
    default: m.LogisticsDashboardPage,
  })),
)
const PlannedLogisticsPage = lazyPage(() =>
  import('./pages/logistics/LogisticsFlowPages').then((m) => ({ default: m.PlannedLogisticsPage })),
)
const InTransitLogisticsPage = lazyPage(() =>
  import('./pages/logistics/LogisticsFlowPages').then((m) => ({
    default: m.InTransitLogisticsPage,
  })),
)
const DeliveredLogisticsPage = lazyPage(() =>
  import('./pages/logistics/LogisticsFlowPages').then((m) => ({
    default: m.DeliveredLogisticsPage,
  })),
)
import ProductsPage from './pages/stock/ProductsPage'
import WarehousesPage from './pages/stock/WarehousesPage'
import WarehouseTransferPage from './pages/stock/WarehouseTransferPage'
import OutgoingWaybillPage from './pages/stock/OutgoingWaybillPage'
import IncomingWaybillPage from './pages/stock/IncomingWaybillPage'
import PriceListsPage from './pages/stock/PriceListsPage'
import StockHistoryPage from './pages/stock/StockHistoryPage'
import StockProductsReportPage from './pages/stock/StockProductsReportPage'
import CostCalculatorRoute, {
  LegacyCostCalculatorRedirect,
} from './pages/stock/CostCalculatorRoute'
import DeliveredPage from './pages/process/DeliveredPage'
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
import VersionPage from './pages/VersionPage'
import { MyPlanPage, BuyPlanPage, CheckoutPage } from './pages/billing/BillingPages'
import PackagesPage from './pages/billing/PackagesPage'
import AnnouncementsPage from './pages/AnnouncementsPage'
import TrainingPage from './pages/TrainingPage'
import AdminControlPage from './pages/AdminControlPage'
import CustomerPortalPage from './pages/portal/CustomerPortalPage'
import OmnichannelPage from './pages/OmnichannelPage'
import CrmPage from './pages/CrmPage'
import CrmCreatePage from './pages/CrmCreatePage'
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
import {
  SocialMediaDashboardPage,
  SocialAccountsPage,
  SocialAiCreatorPage,
  SocialContentStudioPage,
  SocialMediaLibraryPage,
  SocialCampaignsPage,
  SocialSchedulerPage,
  SocialCalendarPage,
  SocialTemplatesPage,
  SocialBrandKitPage,
  SocialApprovalPage,
  SocialQueuePage,
  SocialAnalyticsPage,
  SocialCommentsPage,
  SocialMessagesPage,
  SocialSettingsPage,
  SocialMetaSetupPage,
} from './pages/social/SocialMediaPages'
import AiSettingsHubPage from './pages/settings/AiSettingsHubPage'
import OpenAiSettingsPage from './pages/settings/OpenAiSettingsPage'
import SalesRepresentativesPage from './pages/fieldSales/SalesRepresentativesPage'
import SalesRepReportsPage from './pages/fieldSales/SalesRepReportsPage'
import CourierTrackingPage from './pages/CourierTrackingPage'
import CustomerCourierTrackingPage from './pages/portal/CustomerCourierTrackingPage'
import SevkiyatTrackingPage from './pages/portal/SevkiyatTrackingPage'
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
  DocAiDesignerPage,
  DocApprovalPage,
  DocAssetsPage,
  DocBarcodeDesignerPage,
  DocComponentsPage,
  DocEmailTemplatesPage,
  DocFontsPage,
  DocLocalizationPage,
  DocMarketplacePage,
  DocPdfDesignerPage,
  DocPermissionsPage,
  DocQrDesignerPage,
  DocSmsTemplatesPage,
  DocThemesPage,
  DocVariablesPage,
  DocVersionsPage,
  DocWhatsAppTemplatesPage,
  DocWorkflowPage,
} from './pages/documentCenter/DocCenterModules'
import WebStudioPage from './pages/web/WebStudioPage'
import WebStudioManagementPage from './pages/web/WebStudioManagementPage'
import WebStudioStatusPage from './pages/web/WebStudioStatusPage'
import WebStudioAdminPage from './pages/web/WebStudioAdminPage'
import WebStudioCategoryCreatePage from './pages/web/WebStudioCategoryCreatePage'
import WebStudioProductCreatePage from './pages/web/WebStudioProductCreatePage'

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
    const stopFormGuard = installFormSubmitGuard()
    const stopUpdateCheck = installAppUpdateChecker()
    return () => {
      stopFormGuard?.()
      stopUpdateCheck?.()
    }
  }, [])

  return (
    <AuthProvider>
      <OrgProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/giris" element={<LoginPage />} />
            <Route path="/kayit" element={<RegisterPage />} />
            <Route path="/sifremi-unuttum" element={<ForgotPasswordPage />} />
            <Route path="/sifre-sifirla" element={<ResetPasswordPage />} />
            <Route path="/eposta-dogrula" element={<VerifyEmailPage />} />
            <Route path="/hesap/lisans" element={<LicensePage />} />
            <Route
              path="/deneme-bitti"
              element={
                <RequireAuth>
                  <TrialExpiredPage />
                </RequireAuth>
              }
            />
            <Route
              path="/kurulum"
              element={
                <RequireAuth>
                  <OnboardingWizardRoute />
                </RequireAuth>
              }
            />
            <Route path="/portal/:token" element={<CustomerPortalPage />} />
            <Route path="/kurye-takip/:trackingToken" element={<CustomerCourierTrackingPage />} />
            <Route path="/sevkiyat-takip/:token" element={<SevkiyatTrackingPage />} />
            <Route
              path="*"
              element={
                <RequireAuth>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<DashboardPage />} />
                      <Route path="/guncel-durum" element={<Navigate to="/" replace />} />
                      <Route path="/ai-komut" element={<Navigate to="/" replace />} />
                      <Route path="/command-center" element={<Navigate to="/" replace />} />
                      <Route
                        path="/siparisler"
                        element={
                          <PageSuspense>
                            <OrdersPage />
                          </PageSuspense>
                        }
                      />
                      <Route
                        path="/uretim"
                        element={
                          <PageSuspense>
                            <ProductionPage />
                          </PageSuspense>
                        }
                      />
                      <Route path="/uretim/yeni" element={<ProductionCreatePage />} />
                      <Route path="/uretim/:jobId" element={<ProductionDetailPage />} />
                      <Route path="/mes" element={<ManufacturingCenterPage />} />
                      <Route path="/mes/operator" element={<MesOperatorTabletPage />} />
                      <Route path="/finans" element={<FinanceCenterPage />} />
                      <Route path="/analitik" element={<AnalyticsCenterPage />} />
                      <Route path="/web" element={<Navigate to="/web/studio" replace />} />
                      <Route path="/web/studio" element={<WebStudioPage />} />
                      <Route path="/web/studio/yonetim" element={<WebStudioStatusPage />} />
                      <Route path="/web/studio/yonetim/yonetim" element={<WebStudioAdminPage />} />
                      <Route
                        path="/web/studio/yonetim/kategori-olustur"
                        element={<WebStudioCategoryCreatePage />}
                      />
                      <Route
                        path="/web/studio/yonetim/urun-olustur"
                        element={<WebStudioProductCreatePage />}
                      />
                      <Route
                        path="/web/studio/yonetim/panel"
                        element={<WebStudioManagementPage />}
                      />
                      <Route
                        path="/web/studio/yonetim/domain-bagla"
                        element={<WebStudioManagementPage />}
                      />
                      <Route
                        path="/web/studio/yonetim/kategoriler"
                        element={<WebStudioManagementPage />}
                      />
                      <Route
                        path="/web/studio/yonetim/urunler"
                        element={<WebStudioManagementPage />}
                      />
                      <Route
                        path="/web/studio/yonetim/siparisler"
                        element={<WebStudioManagementPage />}
                      />
                      <Route
                        path="/web/studio/yonetim/profil"
                        element={<WebStudioManagementPage />}
                      />
                      <Route
                        path="/web/studio/yonetim/odeme"
                        element={<WebStudioManagementPage />}
                      />
                      <Route path="/website-os" element={<Navigate to="/web/studio" replace />} />
                      <Route path="/website" element={<Navigate to="/web/studio" replace />} />
                      <Route path="/raporlar" element={<Navigate to="/analitik" replace />} />
                      <Route path="/platform" element={<Navigate to="/" replace />} />
                      <Route path="/cekirdek" element={<Navigate to="/" replace />} />
                      <Route path="/marketplace" element={<Navigate to="/" replace />} />
                      <Route path="/magaza" element={<Navigate to="/" replace />} />
                      <Route path="/entegrasyon" element={<Navigate to="/" replace />} />
                      <Route path="/integration-hub" element={<Navigate to="/" replace />} />
                      <Route path="/musteri-deneyimi" element={<CustomerExperienceCloudPage />} />
                      <Route path="/cxc" element={<Navigate to="/musteri-deneyimi" replace />} />
                      <Route
                        path="/efatura"
                        element={<Navigate to="/finans?tab=einvoice" replace />}
                      />
                      <Route path="/musteriler/faturalar" element={<SalesInvoicesPage />} />
                      <Route path="/musteriler/satis-raporu" element={<SalesReportPage />} />
                      <Route
                        path="/musteriler/tahsilat-raporu"
                        element={<CollectionsReportPage />}
                      />
                      <Route
                        path="/musteriler/gelir-gider-raporu"
                        element={<IncomeExpenseReportPage />}
                      />
                      <Route path="/giderler/liste" element={<ExpenseListPage />} />
                      <Route path="/giderler/kredi-odemeleri" element={<LoanPaymentsPage />} />
                      <Route
                        path="/giderler/gelen-e-faturalar/:invoiceId"
                        element={<IncomingEInvoiceDetailPage />}
                      />
                      <Route
                        path="/giderler/gelen-e-faturalar"
                        element={<IncomingEInvoicesPage />}
                      />
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
                      <Route
                        path="/giderler/calisanlar"
                        element={<Navigate to="/ik/personeller" replace />}
                      />

                      <Route path="/sosyal-medya" element={<SocialMediaDashboardPage />} />
                      <Route path="/sosyal-medya/hesaplar" element={<SocialAccountsPage />} />
                      <Route path="/sosyal-medya/meta-kurulum" element={<SocialMetaSetupPage />} />
                      <Route path="/sosyal-medya/studio" element={<SocialContentStudioPage />} />
                      <Route path="/sosyal-medya/ai-creator" element={<SocialAiCreatorPage />} />
                      <Route path="/sosyal-medya/medya" element={<SocialMediaLibraryPage />} />
                      <Route path="/sosyal-medya/kampanyalar" element={<SocialCampaignsPage />} />
                      <Route path="/sosyal-medya/zamanlama" element={<SocialSchedulerPage />} />
                      <Route path="/sosyal-medya/takvim" element={<SocialCalendarPage />} />
                      <Route path="/sosyal-medya/sablonlar" element={<SocialTemplatesPage />} />
                      <Route path="/sosyal-medya/marka" element={<SocialBrandKitPage />} />
                      <Route path="/sosyal-medya/onay" element={<SocialApprovalPage />} />
                      <Route path="/sosyal-medya/kuyruk" element={<SocialQueuePage />} />
                      <Route path="/sosyal-medya/analitik" element={<SocialAnalyticsPage />} />
                      <Route path="/sosyal-medya/yorumlar" element={<SocialCommentsPage />} />
                      <Route path="/sosyal-medya/mesajlar" element={<SocialMessagesPage />} />
                      <Route path="/sosyal-medya/ayarlar" element={<SocialSettingsPage />} />
                      <Route
                        path="/sosyal-medya/reels"
                        element={<Navigate to="/sosyal-medya/studio" replace />}
                      />
                      <Route path="/ai-buyume" element={<Navigate to="/sosyal-medya" replace />} />
                      <Route
                        path="/ai-buyume/instagram"
                        element={<Navigate to="/sosyal-medya/hesaplar" replace />}
                      />
                      <Route
                        path="/ai-buyume/reel"
                        element={<Navigate to="/sosyal-medya/studio" replace />}
                      />
                      <Route
                        path="/ai-buyume/*"
                        element={<Navigate to="/sosyal-medya" replace />}
                      />
                      <Route path="/giderler/giderler-raporu" element={<ExpensesReportPage />} />
                      <Route path="/giderler/odemeler-raporu" element={<PaymentsReportPage />} />
                      <Route path="/giderler/kdv-raporu" element={<VatReportPage />} />
                      <Route path="/giderler" element={<Navigate to="/giderler/liste" replace />} />
                      <Route path="/musteriler" element={<CustomersPage listKind="customer" />} />
                      <Route
                        path="/musteri-bul"
                        element={<Navigate to="/saha-satis/musteri-bul" replace />}
                      />
                      <Route
                        path="/suppliers"
                        element={<Navigate to="/giderler/tedarikciler" replace />}
                      />
                      <Route path="/crm" element={<CrmPage view="all" />} />
                      <Route path="/crm/notlar" element={<CrmPage view="note" />} />
                      <Route path="/crm/gorevler" element={<CrmPage view="task" />} />
                      <Route path="/crm/randevular" element={<CrmPage view="appointment" />} />
                      <Route path="/crm/gorev-yeni" element={<CrmCreatePage type="task" />} />
                      <Route
                        path="/crm/randevu-yeni"
                        element={<CrmCreatePage type="appointment" />}
                      />
                      <Route path="/crm/not-yeni" element={<CrmCreatePage type="note" />} />
                      <Route
                        path="/crm/gorev/:id/duzenle"
                        element={<CrmCreatePage type="task" />}
                      />
                      <Route
                        path="/crm/randevu/:id/duzenle"
                        element={<CrmCreatePage type="appointment" />}
                      />
                      <Route path="/crm/not/:id/duzenle" element={<CrmCreatePage type="note" />} />
                      <Route path="/saha-satis" element={<FieldSalesPage />} />
                      <Route path="/saha-satis/musteri-bul" element={<CustomerFinderPage />} />
                      <Route
                        path="/saha-satis/temsilciler"
                        element={<SalesRepresentativesPage />}
                      />
                      <Route
                        path="/saha-satis/temsilci-raporlari"
                        element={<SalesRepReportsPage />}
                      />
                      <Route path="/musteriler/yeni" element={<CustomerCreatePage />} />
                      <Route
                        path="/musteriler/:customerId/belge/:docType"
                        element={<CustomerDocumentPage />}
                      />
                      <Route
                        path="/musteriler/:customerId/hareket/:movementId"
                        element={<CustomerMovementDetailPage />}
                      />
                      <Route
                        path="/musteriler/:customerId/yuk-sevkiyat"
                        element={<CustomerLoadShipmentCreatePage />}
                      />
                      <Route path="/musteriler/:customerId" element={<CustomerDetailPage />} />
                      <Route
                        path="/teklifler"
                        element={
                          <PageSuspense>
                            <QuotesPage />
                          </PageSuspense>
                        }
                      />
                      <Route path="/belge-merkezi" element={<DocumentCenterPage />} />
                      <Route
                        path="/belge-platformu"
                        element={<Navigate to="/belge-merkezi" replace />}
                      />
                      <Route path="/belge-merkezi/sablonlar" element={<DocTemplatesPage />} />
                      <Route
                        path="/belge-merkezi/tasarimci"
                        element={<DocTemplateDesignerPage />}
                      />
                      <Route path="/belge-merkezi/etiket" element={<DocLabelDesignerPage />} />
                      <Route path="/belge-merkezi/barkod" element={<DocBarcodeDesignerPage />} />
                      <Route path="/belge-merkezi/qr" element={<DocQrDesignerPage />} />
                      <Route path="/belge-merkezi/pdf" element={<DocPdfDesignerPage />} />
                      <Route path="/belge-merkezi/ai-designer" element={<DocAiDesignerPage />} />
                      <Route path="/belge-merkezi/eposta" element={<DocEmailTemplatesPage />} />
                      <Route path="/belge-merkezi/sms" element={<DocSmsTemplatesPage />} />
                      <Route
                        path="/belge-merkezi/whatsapp"
                        element={<DocWhatsAppTemplatesPage />}
                      />
                      <Route
                        path="/belge-merkezi/yazici-profilleri"
                        element={<DocPrintProfilesPage />}
                      />
                      <Route path="/belge-merkezi/degiskenler" element={<DocVariablesPage />} />
                      <Route path="/belge-merkezi/bilesenler" element={<DocComponentsPage />} />
                      <Route path="/belge-merkezi/assets" element={<DocAssetsPage />} />
                      <Route path="/belge-merkezi/fonts" element={<DocFontsPage />} />
                      <Route path="/belge-merkezi/temalar" element={<DocThemesPage />} />
                      <Route path="/belge-merkezi/localization" element={<DocLocalizationPage />} />
                      <Route path="/belge-merkezi/onay" element={<DocApprovalPage />} />
                      <Route path="/belge-merkezi/workflow" element={<DocWorkflowPage />} />
                      <Route path="/belge-merkezi/izinler" element={<DocPermissionsPage />} />
                      <Route path="/belge-merkezi/marketplace" element={<DocMarketplacePage />} />
                      <Route path="/belge-merkezi/versiyonlar" element={<DocVersionsPage />} />
                      <Route path="/belge-merkezi/arsiv" element={<DocArchivePage />} />
                      <Route path="/belge-merkezi/yazdir" element={<DocPrintPage />} />
                      <Route path="/belge-merkezi/kayitlar" element={<DocPrintJobsPage />} />
                      <Route
                        path="/depo"
                        element={
                          <PageSuspense>
                            <DepoPageLazy />
                          </PageSuspense>
                        }
                      />
                      <Route
                        path="/sevkiyat"
                        element={
                          <PageSuspense>
                            <SevkiyatPageLazy />
                          </PageSuspense>
                        }
                      />
                      <Route
                        path="/sevkiyat/:id"
                        element={
                          <PageSuspense>
                            <SevkiyatPageLazy />
                          </PageSuspense>
                        }
                      />
                      <Route path="/siparis-deposu" element={<Navigate to="/depo" replace />} />
                      <Route path="/stok-deposu" element={<Navigate to="/depo" replace />} />
                      <Route path="/teslim-edilenler" element={<DeliveredPage />} />
                      <Route
                        path="/lojistik"
                        element={
                          <PageSuspense>
                            <LogisticsDashboardPage />
                          </PageSuspense>
                        }
                      />
                      <Route
                        path="/lojistik/yukleme-plani"
                        element={
                          <PageSuspense>
                            <TruckLoadCalculatorPage />
                          </PageSuspense>
                        }
                      />
                      <Route
                        path="/lojistik/planlanan"
                        element={
                          <PageSuspense>
                            <PlannedLogisticsPage />
                          </PageSuspense>
                        }
                      />
                      <Route
                        path="/lojistik/teslimatta"
                        element={
                          <PageSuspense>
                            <InTransitLogisticsPage />
                          </PageSuspense>
                        }
                      />
                      <Route
                        path="/lojistik/teslim-edildi"
                        element={
                          <PageSuspense>
                            <DeliveredLogisticsPage />
                          </PageSuspense>
                        }
                      />
                      <Route path="/lojistik/*" element={<Navigate to="/lojistik" replace />} />
                      <Route path={CASH_BASE_PATH} element={<CashPage />} />
                      <Route path={`${CASH_BASE_PATH}/:accountId`} element={<CashPage />} />
                      <Route
                        path="/nakit/nakit-kasa"
                        element={
                          <TreasuryAccountsListPage accountType="Nakit Kasa" title="Nakit Kasa" />
                        }
                      />
                      <Route
                        path="/nakit/bankalar"
                        element={
                          <TreasuryAccountsListPage accountType="Banka Hesabı" title="Bankalar" />
                        }
                      />
                      <Route path="/nakit/cekler" element={<ChequesPage />} />
                      <Route path="/nakit/senetler" element={<PromissoryNotesPage />} />
                      <Route path={TREASURY_REPORTS_PATH} element={<CashBankReportPage />} />
                      <Route
                        path="/nakit/raporlar/nakit-kasa"
                        element={
                          <TreasuryTypeReportPage
                            accountType="Nakit Kasa"
                            title="Nakit Kasa Raporu"
                          />
                        }
                      />
                      <Route
                        path="/nakit/raporlar/banka"
                        element={
                          <TreasuryTypeReportPage accountType="Banka Hesabı" title="Banka Raporu" />
                        }
                      />
                      <Route
                        path="/nakit/raporlar/cek"
                        element={
                          <TreasuryTypeReportPage accountType="Çek Kasası" title="Çek Raporu" />
                        }
                      />
                      <Route
                        path="/nakit/raporlar/senet"
                        element={
                          <TreasuryTypeReportPage accountType="Senet Kasası" title="Senet Raporu" />
                        }
                      />
                      <Route
                        path="/nakit/kasa-banka-raporu"
                        element={<Navigate to={TREASURY_REPORTS_PATH} replace />}
                      />
                      <Route path="/nakit/nakit-akisi-raporu" element={<CashFlowReportPage />} />
                      <Route path="/nakit" element={<Navigate to={CASH_BASE_PATH} replace />} />
                      <Route path="/kasa" element={<Navigate to={CASH_BASE_PATH} replace />} />
                      <Route path="/kasa/:accountId" element={<LegacyKasaAccountRedirect />} />
                      <Route path="/shopping" element={<ShoppingPage />} />
                      <Route path="/projeler" element={<ProjectsListPage scope="all" />} />
                      <Route path="/projeler/yeni" element={<ProjectsPage />} />
                      <Route
                        path="/projeler/devam-eden"
                        element={<ProjectsListPage scope="ongoing" />}
                      />
                      <Route
                        path="/projeler/tamamlanan"
                        element={<ProjectsListPage scope="completed" />}
                      />
                      <Route
                        path="/projeler/iptal"
                        element={<ProjectsListPage scope="cancelled" />}
                      />
                      <Route path="/ayarlar" element={<SettingsPage />} />
                      <Route path="/ayarlar/master-data" element={<MasterDataHubPage />} />
                      <Route path="/otomasyon" element={<WorkflowHubPage />} />
                      <Route
                        path="/otomasyon/designer"
                        element={
                          <PageSuspense>
                            <WorkflowDesignerPage />
                          </PageSuspense>
                        }
                      />
                      <Route
                        path="/otomasyon/designer/:id"
                        element={
                          <PageSuspense>
                            <WorkflowDesignerPage />
                          </PageSuspense>
                        }
                      />
                      <Route path="/aios" element={<AiosHubPage />} />
                      <Route path="/aios/bachy" element={<BachySettingsPage />} />
                      <Route path="/ai-beyin" element={<Navigate to="/aios" replace />} />
                      <Route path="/ai-organizasyon" element={<AiEnterpriseOrgPage />} />
                      <Route
                        path="/ai-enterprise-org"
                        element={<Navigate to="/ai-organizasyon" replace />}
                      />
                      <Route path="/ai-otonom" element={<AiAutonomousCompanyPage />} />
                      <Route
                        path="/autonomous-company"
                        element={<Navigate to="/ai-otonom" replace />}
                      />
                      <Route path="/ai-uygulama" element={<AiAppBuilderPage />} />
                      <Route
                        path="/ai-app-builder"
                        element={<Navigate to="/ai-uygulama" replace />}
                      />
                      <Route path="/bilgi-merkezi" element={<KnowledgeCenterPage />} />
                      <Route path="/dijital-ikiz" element={<DigitalTwinCenterPage />} />
                      <Route path="/ticaret" element={<Navigate to="/" replace />} />
                      <Route path="/commerce" element={<Navigate to="/" replace />} />
                      <Route path="/bayi" element={<Navigate to="/" replace />} />
                      <Route path="/ayarlar/ai" element={<AiSettingsHubPage />} />
                      <Route path="/ayarlar/ai/openai" element={<OpenAiSettingsPage />} />
                      <Route path="/ayarlar/guncel-durum" element={<GuncelDurumSettingsPage />} />
                      <Route
                        path="/ayarlar/mesaj-merkezi"
                        element={<Navigate to="/mesajlar?ayarlar=1" replace />}
                      />
                      <Route path="/ayarlar/vergi-kdv" element={<TaxVatSettingsPage />} />
                      <Route path="/ayarlar/kasa-banka" element={<CashBankSettingsPage />} />
                      <Route path="/ayarlar/etiketler" element={<LabelsSettingsPage />} />
                      <Route path="/ayarlar/etiket-listesi" element={<TagLabelsSettingsPage />} />
                      <Route path="/ayarlar/sektorel" element={<SectoralSettingsPage />} />
                      <Route
                        path="/ayarlar/sektorel/:categoryId"
                        element={<SectoralCategorySettingsPage />}
                      />
                      <Route path="/ayarlar/kurumsal-yapi" element={<OrgHubPage />} />
                      <Route
                        path="/ayarlar/kurumsal-yapi/sirketler"
                        element={<OrgCompaniesPage />}
                      />
                      <Route path="/ayarlar/kurumsal-yapi/subeler" element={<OrgBranchesPage />} />
                      <Route
                        path="/ayarlar/kurumsal-yapi/depolar"
                        element={<OrgWarehousesPage />}
                      />
                      <Route
                        path="/ayarlar/kurumsal-yapi/departmanlar"
                        element={<OrgDepartmentsPage />}
                      />
                      <Route
                        path="/ayarlar/kurumsal-yapi/kullanici-yetkileri"
                        element={<OrgUserPermissionsPage />}
                      />
                      <Route
                        path="/ayarlar/kurumsal-yapi/sirket-ayarlari"
                        element={<OrgCompanySettingsPage />}
                      />
                      <Route path="/profil" element={<ProfilePage />} />
                      <Route path="/surum" element={<VersionPage />} />
                      <Route path="/versiyon" element={<Navigate to="/surum" replace />} />
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
                        path="/stok/maliyet-hesaplama"
                        element={
                          <CostCalculatorRoute variant="baklava" moduleId="baklavaCostCalculator" />
                        }
                      />
                      <Route
                        path="/stok/baklava-kutu-maliyet-hesaplama"
                        element={<LegacyCostCalculatorRedirect />}
                      />
                      <Route
                        path="/stok/urun-maliyet-hesaplama"
                        element={<LegacyCostCalculatorRedirect />}
                      />
                      <Route
                        path="/stok/pasta-kutu-maliyet-hesaplama"
                        element={<LegacyCostCalculatorRedirect />}
                      />
                      <Route path="/stok/depolar" element={<WarehousesPage />} />
                      <Route
                        path="/stok/depolar-arasi-transfer"
                        element={<WarehouseTransferPage />}
                      />
                      <Route path="/stok/giden-irsaliye" element={<OutgoingWaybillPage />} />
                      <Route path="/stok/gelen-irsaliye" element={<IncomingWaybillPage />} />
                      <Route path="/stok/fiyat-listeleri" element={<PriceListsPage />} />
                      <Route path="/stok/stok-gecmisi" element={<StockHistoryPage />} />
                      <Route
                        path="/stok/stoktaki-urunler-raporu"
                        element={<StockProductsReportPage />}
                      />
                    </Routes>
                  </Layout>
                </RequireAuth>
              }
            />
          </Routes>
        </BrowserRouter>
      </OrgProvider>
    </AuthProvider>
  )
}
