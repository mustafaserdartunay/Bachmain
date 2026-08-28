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
  AcceptInvitePage,
} from './pages/auth/AuthPages'
import LicensePage from './pages/auth/LicensePage'
import TrialExpiredPage from './pages/auth/TrialExpiredPage'
import OnboardingWizard from './pages/onboarding/OnboardingWizard'
import Layout from './components/Layout/Layout'
import { lazyNamed, lazyPage, PageSuspense } from './components/Common/PageSuspense'
import { PageErrorBoundary } from './components/Common/AppErrorBoundary'
import { CASH_BASE_PATH, TREASURY_REPORTS_PATH } from './data/treasuryMenu'
import DashboardPage from './pages/DashboardPage'

const CashPage = lazyPage(() => import('./pages/CashPage'))
const ChequesPage = lazyPage(() => import('./pages/treasury/ChequesPage'))
const PromissoryNotesPage = lazyPage(() => import('./pages/treasury/PromissoryNotesPage'))
const TreasuryAccountsListPage = lazyPage(() => import('./pages/treasury/TreasuryAccountsListPage'))
const TreasuryTypeReportPage = lazyPage(() => import('./pages/treasury/TreasuryTypeReportPage'))
const CashBankReportPage = lazyPage(() => import('./pages/treasury/CashBankReportPage'))
const CashFlowReportPage = lazyPage(() => import('./pages/treasury/CashFlowReportPage'))
const CustomerCreatePage = lazyPage(() => import('./pages/CustomerCreatePage'))
const MasterDataHubPage = lazyPage(() => import('./pages/MasterDataHubPage'))
const WorkflowHubPage = lazyPage(() => import('./pages/WorkflowHubPage'))
const AiosHubPage = lazyPage(() => import('./pages/AiosHubPage'))
const BachySettingsPage = lazyPage(() => import('./pages/BachySettingsPage'))
const AiEnterpriseOrgPage = lazyPage(() => import('./pages/AiEnterpriseOrgPage'))
const AiAutonomousCompanyPage = lazyPage(() => import('./pages/AiAutonomousCompanyPage'))
const AiAppBuilderPage = lazyPage(() => import('./pages/AiAppBuilderPage'))
const KnowledgeCenterPage = lazyPage(() => import('./pages/KnowledgeCenterPage'))
const DigitalTwinCenterPage = lazyPage(() => import('./pages/DigitalTwinCenterPage'))
const ManufacturingCenterPage = lazyPage(() => import('./pages/mes/ManufacturingCenterPage'))
const MesOperatorTabletPage = lazyPage(() => import('./pages/mes/MesOperatorTabletPage'))
const FinanceCenterPage = lazyPage(() => import('./pages/FinanceCenterPage'))
const AnalyticsCenterPage = lazyPage(() => import('./pages/AnalyticsCenterPage'))
const CustomerExperienceCloudPage = lazyPage(() => import('./pages/CustomerExperienceCloudPage'))
const CustomerDetailPage = lazyPage(() => import('./pages/CustomerDetailPage'))
const CustomerLoadShipmentCreatePage = lazyPage(
  () => import('./pages/CustomerLoadShipmentCreatePage'),
)
const CustomerMovementDetailPage = lazyPage(() => import('./pages/CustomerMovementDetailPage'))
const CustomerDocumentPage = lazyPage(() => import('./pages/CustomerDocumentPage'))
const CustomerFinderPage = lazyPage(() => import('./pages/CustomerFinderPage'))
const CustomersPage = lazyPage(() => import('./pages/CustomersPage'))
const SuppliersPage = lazyPage(() => import('./pages/SuppliersPage'))
const SalesInvoicesPage = lazyPage(() => import('./pages/SalesInvoicesPage'))
const SalesReportPage = lazyPage(() => import('./pages/SalesReportPage'))
const CollectionsReportPage = lazyPage(() => import('./pages/CollectionsReportPage'))
const IncomeExpenseReportPage = lazyPage(() => import('./pages/IncomeExpenseReportPage'))
const ExpenseListPage = lazyPage(() => import('./pages/expenses/ExpenseListPage'))
const LoanPaymentsPage = lazyPage(() => import('./pages/expenses/LoanPaymentsPage'))
const IncomingEInvoicesPage = lazyPage(() => import('./pages/expenses/IncomingEInvoicesPage'))
const IncomingEInvoiceDetailPage = lazyPage(
  () => import('./pages/expenses/IncomingEInvoiceDetailPage'),
)
const EDocumentsHubPage = lazyPage(() => import('./pages/edocuments/EDocumentsHubPage'))
const EDocumentListPage = lazyPage(() => import('./pages/edocuments/EDocumentListPage'))
const EDocumentDetailPage = lazyPage(() => import('./pages/edocuments/EDocumentDetailPage'))
const EDocumentComposePage = lazyPage(() => import('./pages/edocuments/EDocumentComposePage'))
const EDocumentSettingsPage = lazyPage(() => import('./pages/edocuments/EDocumentSettingsPage'))
const EDocumentSearchPage = lazyPage(() => import('./pages/edocuments/EDocumentSearchPage'))
const ExpensesReportPage = lazyPage(() => import('./pages/expenses/ExpensesReportPage'))
const PaymentsReportPage = lazyPage(() => import('./pages/expenses/PaymentsReportPage'))
const VatReportPage = lazyPage(() => import('./pages/expenses/VatReportPage'))
const PersonnelPage = lazyPage(() => import('./pages/PersonnelPage'))
const ProductionCreatePage = lazyPage(() => import('./pages/ProductionCreatePage'))
const ProductionDetailPage = lazyPage(() => import('./pages/ProductionDetailPage'))
const ProjectsPage = lazyPage(() => import('./pages/ProjectsPage'))
const ProjectsListPage = lazyPage(() => import('./pages/ProjectsListPage'))
const ShoppingPage = lazyPage(() => import('./pages/ShoppingPage'))
const QuotesPage = lazyPage(() => import('./pages/QuotesPage'))
const OrdersPage = lazyPage(() => import('./pages/OrdersPage'))
const ProductionPage = lazyPage(() => import('./pages/ProductionPage'))
const ProcessReportsPage = lazyPage(() => import('./pages/ProcessReportsPage'))
const DepoPageLazy = lazyPage(() => import('./pages/process/DepoPage'))
const SevkiyatPageLazy = lazyPage(() => import('./pages/process/SevkiyatPage'))
const WorkflowDesignerPage = lazyPage(() => import('./pages/WorkflowDesignerPage'))
const TruckLoadCalculatorPage = lazyPage(() => import('./components/Logistics/TruckLoadCalculator'))
const LogisticsDashboardPage = lazyNamed(
  () => import('./pages/logistics/LogisticsFlowPages'),
  'LogisticsDashboardPage',
)
const PlannedLogisticsPage = lazyNamed(
  () => import('./pages/logistics/LogisticsFlowPages'),
  'PlannedLogisticsPage',
)
const InTransitLogisticsPage = lazyNamed(
  () => import('./pages/logistics/LogisticsFlowPages'),
  'InTransitLogisticsPage',
)
const DeliveredLogisticsPage = lazyNamed(
  () => import('./pages/logistics/LogisticsFlowPages'),
  'DeliveredLogisticsPage',
)
const TirSevkiyatPage = lazyPage(() => import('./pages/logistics/TirSevkiyatPage'))
const TirSevkiyatDetailPage = lazyPage(() => import('./pages/logistics/TirSevkiyatDetailPage'))
const ProductsPage = lazyPage(() => import('./pages/stock/ProductsPage'))
const WarehousesPage = lazyPage(() => import('./pages/stock/WarehousesPage'))
const WarehouseTransferPage = lazyPage(() => import('./pages/stock/WarehouseTransferPage'))
const OutgoingWaybillPage = lazyPage(() => import('./pages/stock/OutgoingWaybillPage'))
const IncomingWaybillPage = lazyPage(() => import('./pages/stock/IncomingWaybillPage'))
const PriceListsPage = lazyPage(() => import('./pages/stock/PriceListsPage'))
const StockHistoryPage = lazyPage(() => import('./pages/stock/StockHistoryPage'))
const StockProductsReportPage = lazyPage(() => import('./pages/stock/StockProductsReportPage'))
const CostCalculatorRoute = lazyPage(() => import('./pages/stock/CostCalculatorRoute'))
const LegacyCostCalculatorRedirect = lazyNamed(
  () => import('./pages/stock/CostCalculatorRoute'),
  'LegacyCostCalculatorRedirect',
)
const DeliveredPage = lazyPage(() => import('./pages/process/DeliveredPage'))
const SettingsPage = lazyPage(() => import('./pages/SettingsPage'))
const TeamUsersPage = lazyPage(() => import('./pages/settings/TeamUsersPage'))
const orgPages = () => import('./pages/org/OrgStructurePages')
const OrgHubPage = lazyNamed(orgPages, 'OrgHubPage')
const OrgCompaniesPage = lazyNamed(orgPages, 'OrgCompaniesPage')
const OrgBranchesPage = lazyNamed(orgPages, 'OrgBranchesPage')
const OrgWarehousesPage = lazyNamed(orgPages, 'OrgWarehousesPage')
const OrgDepartmentsPage = lazyNamed(orgPages, 'OrgDepartmentsPage')
const OrgUserPermissionsPage = lazyNamed(orgPages, 'OrgUserPermissionsPage')
const OrgCompanySettingsPage = lazyNamed(orgPages, 'OrgCompanySettingsPage')
const LabelsSettingsPage = lazyPage(() => import('./pages/LabelsSettingsPage'))
const TagLabelsSettingsPage = lazyPage(() => import('./pages/TagLabelsSettingsPage'))
const CashBankSettingsPage = lazyPage(() => import('./pages/CashBankSettingsPage'))
const ProfilePage = lazyPage(() => import('./pages/ProfilePage'))
const VersionPage = lazyPage(() => import('./pages/VersionPage'))
const billingPages = () => import('./pages/billing/BillingPages')
const MyPlanPage = lazyNamed(billingPages, 'MyPlanPage')
const BuyPlanPage = lazyNamed(billingPages, 'BuyPlanPage')
const CheckoutPage = lazyNamed(billingPages, 'CheckoutPage')
const PackagesPage = lazyPage(() => import('./pages/billing/PackagesPage'))
const AnnouncementsPage = lazyPage(() => import('./pages/AnnouncementsPage'))
const TrainingPage = lazyPage(() => import('./pages/TrainingPage'))
const AdminControlPage = lazyPage(() => import('./pages/AdminControlPage'))
const CustomerPortalPage = lazyPage(() => import('./pages/portal/CustomerPortalPage'))
const OmnichannelPage = lazyPage(() => import('./pages/OmnichannelPage'))
const CrmPage = lazyPage(() => import('./pages/CrmPage'))
const CrmCreatePage = lazyPage(() => import('./pages/CrmCreatePage'))
const FieldSalesPage = lazyPage(() => import('./pages/FieldSalesPage'))
const PdksDashboardPage = lazyPage(() => import('./pages/hr/PdksDashboardPage'))
const AttendanceTrackingPage = lazyPage(() => import('./pages/hr/AttendanceTrackingPage'))
const ShiftsPage = lazyPage(() => import('./pages/hr/ShiftsPage'))
const LeavesPage = lazyPage(() => import('./pages/hr/LeavesPage'))
const OvertimePage = lazyPage(() => import('./pages/hr/OvertimePage'))
const AbsencesPage = lazyPage(() => import('./pages/hr/AbsencesPage'))
const TaskTrackingPage = lazyPage(() => import('./pages/hr/TaskTrackingPage'))
const MapTrackingPage = lazyPage(() => import('./pages/hr/MapTrackingPage'))
const MobileCheckInPage = lazyPage(() => import('./pages/hr/MobileCheckInPage'))
const PdksSettingsPage = lazyPage(() => import('./pages/hr/PdksSettingsPage'))
const socialPages = () => import('./pages/social/SocialMediaPages')
const SocialMediaDashboardPage = lazyNamed(socialPages, 'SocialMediaDashboardPage')
const SocialAccountsPage = lazyNamed(socialPages, 'SocialAccountsPage')
const SocialAiCreatorPage = lazyNamed(socialPages, 'SocialAiCreatorPage')
const SocialContentStudioPage = lazyNamed(socialPages, 'SocialContentStudioPage')
const SocialMediaLibraryPage = lazyNamed(socialPages, 'SocialMediaLibraryPage')
const SocialCampaignsPage = lazyNamed(socialPages, 'SocialCampaignsPage')
const SocialSchedulerPage = lazyNamed(socialPages, 'SocialSchedulerPage')
const SocialCalendarPage = lazyNamed(socialPages, 'SocialCalendarPage')
const SocialTemplatesPage = lazyNamed(socialPages, 'SocialTemplatesPage')
const SocialBrandKitPage = lazyNamed(socialPages, 'SocialBrandKitPage')
const SocialApprovalPage = lazyNamed(socialPages, 'SocialApprovalPage')
const SocialQueuePage = lazyNamed(socialPages, 'SocialQueuePage')
const SocialAnalyticsPage = lazyNamed(socialPages, 'SocialAnalyticsPage')
const SocialCommentsPage = lazyNamed(socialPages, 'SocialCommentsPage')
const SocialMessagesPage = lazyNamed(socialPages, 'SocialMessagesPage')
const SocialSettingsPage = lazyNamed(socialPages, 'SocialSettingsPage')
const SocialMetaSetupPage = lazyNamed(socialPages, 'SocialMetaSetupPage')
const AiSettingsHubPage = lazyPage(() => import('./pages/settings/AiSettingsHubPage'))
const OpenAiSettingsPage = lazyPage(() => import('./pages/settings/OpenAiSettingsPage'))
const SalesRepresentativesPage = lazyPage(
  () => import('./pages/fieldSales/SalesRepresentativesPage'),
)
const SalesRepReportsPage = lazyPage(() => import('./pages/fieldSales/SalesRepReportsPage'))
const CustomerCourierTrackingPage = lazyPage(
  () => import('./pages/portal/CustomerCourierTrackingPage'),
)
const SevkiyatTrackingPage = lazyPage(() => import('./pages/portal/SevkiyatTrackingPage'))
const SectoralSettingsPage = lazyPage(() => import('./pages/SectoralSettingsPage'))
const SectoralCategorySettingsPage = lazyPage(() => import('./pages/SectoralCategorySettingsPage'))
const GuncelDurumSettingsPage = lazyPage(() => import('./pages/GuncelDurumSettingsPage'))
const TaxVatSettingsPage = lazyPage(() => import('./pages/TaxVatSettingsPage'))
const DocumentCenterPage = lazyPage(() => import('./pages/documentCenter/DocumentCenterPage'))
const DocTemplatesPage = lazyPage(() => import('./pages/documentCenter/DocTemplatesPage'))
const DocTemplateDesignerPage = lazyPage(
  () => import('./pages/documentCenter/DocTemplateDesignerPage'),
)
const DocLabelDesignerPage = lazyPage(() => import('./pages/documentCenter/DocLabelDesignerPage'))
const DocPrintPage = lazyPage(() => import('./pages/documentCenter/DocPrintPage'))
const DocPrintJobsPage = lazyPage(() => import('./pages/documentCenter/DocPrintJobsPage'))
const DocPrintProfilesPage = lazyPage(() => import('./pages/documentCenter/DocPrintProfilesPage'))
const docModules = () => import('./pages/documentCenter/DocCenterModules')
const DocArchivePage = lazyNamed(docModules, 'DocArchivePage')
const DocAiDesignerPage = lazyNamed(docModules, 'DocAiDesignerPage')
const DocApprovalPage = lazyNamed(docModules, 'DocApprovalPage')
const DocAssetsPage = lazyNamed(docModules, 'DocAssetsPage')
const DocBarcodeDesignerPage = lazyNamed(docModules, 'DocBarcodeDesignerPage')
const DocComponentsPage = lazyNamed(docModules, 'DocComponentsPage')
const DocEmailTemplatesPage = lazyNamed(docModules, 'DocEmailTemplatesPage')
const DocFontsPage = lazyNamed(docModules, 'DocFontsPage')
const DocLocalizationPage = lazyNamed(docModules, 'DocLocalizationPage')
const DocMarketplacePage = lazyNamed(docModules, 'DocMarketplacePage')
const DocPdfDesignerPage = lazyNamed(docModules, 'DocPdfDesignerPage')
const DocPermissionsPage = lazyNamed(docModules, 'DocPermissionsPage')
const DocQrDesignerPage = lazyNamed(docModules, 'DocQrDesignerPage')
const DocSmsTemplatesPage = lazyNamed(docModules, 'DocSmsTemplatesPage')
const DocThemesPage = lazyNamed(docModules, 'DocThemesPage')
const DocVariablesPage = lazyNamed(docModules, 'DocVariablesPage')
const DocVersionsPage = lazyNamed(docModules, 'DocVersionsPage')
const DocWhatsAppTemplatesPage = lazyNamed(docModules, 'DocWhatsAppTemplatesPage')
const DocWorkflowPage = lazyNamed(docModules, 'DocWorkflowPage')
const WebStudioPaymentPage = lazyPage(() => import('./pages/web/WebStudioPaymentPage'))
const WebStudioSettingsPage = lazyPage(() => import('./pages/web/WebStudioSettingsPage'))
const WebStudioCategoryCreatePage = lazyPage(
  () => import('./pages/web/WebStudioCategoryCreatePage'),
)
const WebStudioProductCreatePage = lazyPage(() => import('./pages/web/WebStudioProductCreatePage'))
const WebStudioTemplatePage = lazyPage(() => import('./pages/web/WebStudioTemplatePage'))
const WebStudioOrdersPage = lazyPage(() => import('./pages/web/WebStudioOrdersPage'))
const WebStudioDomainConnectPage = lazyPage(() => import('./pages/web/WebStudioDomainConnectPage'))
const WebStudioPage = lazyPage(() => import('./pages/web/WebStudioPage'))
const WebStorefrontPublishPage = lazyPage(() => import('./pages/web/WebStorefrontPublishPage'))

function LazyScreen({ children }) {
  return (
    <PageErrorBoundary>
      <PageSuspense>{children}</PageSuspense>
    </PageErrorBoundary>
  )
}

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
            <Route path="/davet" element={<AcceptInvitePage />} />
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
            <Route
              path="/portal/:token"
              element={
                <LazyScreen>
                  <CustomerPortalPage />
                </LazyScreen>
              }
            />
            <Route
              path="/kurye-takip/:trackingToken"
              element={
                <LazyScreen>
                  <CustomerCourierTrackingPage />
                </LazyScreen>
              }
            />
            <Route
              path="/sevkiyat-takip/:token"
              element={
                <LazyScreen>
                  <SevkiyatTrackingPage />
                </LazyScreen>
              }
            />
            <Route
              path="/vitrin"
              element={
                <LazyScreen>
                  <WebStorefrontPublishPage />
                </LazyScreen>
              }
            />
            <Route
              path="/vitrin/*"
              element={
                <LazyScreen>
                  <WebStorefrontPublishPage />
                </LazyScreen>
              }
            />
            <Route
              path="*"
              element={
                <RequireAuth>
                  <Layout>
                    <LazyScreen>
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
                        <Route
                          path="/web"
                          element={<Navigate to="/web/studio/yonetim/panel" replace />}
                        />
                        <Route
                          path="/web/studio"
                          element={<Navigate to="/web/studio/yonetim/panel" replace />}
                        />
                        <Route
                          path="/web/studio/yonetim"
                          element={<Navigate to="/web/studio/yonetim/panel" replace />}
                        />
                        <Route
                          path="/web/studio/yonetim/yonetim"
                          element={<Navigate to="/web/studio/yonetim/panel" replace />}
                        />
                        <Route
                          path="/web/studio/yonetim/kategori-olustur"
                          element={<Navigate to="/web/studio/yonetim/kategoriler" replace />}
                        />
                        <Route
                          path="/web/studio/yonetim/urun-olustur"
                          element={<Navigate to="/web/studio/yonetim/urunler" replace />}
                        />
                        <Route
                          path="/web/studio/yonetim/ayarlar"
                          element={<Navigate to="/web/studio/yonetim/profil" replace />}
                        />
                        <Route
                          path="/web/studio/yonetim/ayarlar/domain-bagla"
                          element={<Navigate to="/web/studio/yonetim/domain-bagla" replace />}
                        />
                        <Route
                          path="/web/studio/yonetim/template"
                          element={<Navigate to="/web/studio/yonetim/tasarim" replace />}
                        />
                        <Route
                          path="/web/studio/yonetim/panel"
                          element={<DashboardPage studioMode />}
                        />
                        <Route
                          path="/web/studio/yonetim/tasarim"
                          element={<WebStudioTemplatePage />}
                        />
                        <Route
                          path="/web/studio/yonetim/kategoriler"
                          element={<WebStudioCategoryCreatePage />}
                        />
                        <Route
                          path="/web/studio/yonetim/urunler"
                          element={<WebStudioProductCreatePage />}
                        />
                        <Route
                          path="/web/studio/yonetim/profil"
                          element={<WebStudioSettingsPage />}
                        />
                        <Route
                          path="/web/studio/yonetim/odeme"
                          element={<WebStudioPaymentPage />}
                        />
                        <Route
                          path="/web/studio/yonetim/siparisler"
                          element={<WebStudioOrdersPage />}
                        />
                        <Route
                          path="/web/studio/yonetim/domain-bagla"
                          element={<WebStudioDomainConnectPage />}
                        />
                        <Route path="/web/studio/siteler" element={<WebStudioPage />} />
                        <Route
                          path="/website-os"
                          element={<Navigate to="/web/studio/yonetim/panel" replace />}
                        />
                        <Route
                          path="/website"
                          element={<Navigate to="/web/studio/yonetim/panel" replace />}
                        />
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
                        <Route path="/e-belgeler" element={<EDocumentsHubPage />} />
                        <Route
                          path="/e-belgeler/e-fatura"
                          element={<EDocumentListPage title="E-Fatura" documentType="e-fatura" />}
                        />
                        <Route
                          path="/e-belgeler/e-arsiv"
                          element={<EDocumentListPage title="E-Arşiv" documentType="e-arsiv" />}
                        />
                        <Route
                          path="/e-belgeler/gelen"
                          element={
                            <EDocumentListPage title="Gelen Faturalar" direction="incoming" />
                          }
                        />
                        <Route
                          path="/e-belgeler/giden"
                          element={
                            <EDocumentListPage title="Giden Faturalar" direction="outgoing" />
                          }
                        />
                        <Route
                          path="/e-belgeler/taslaklar"
                          element={<EDocumentListPage title="Taslaklar" status="DRAFT" />}
                        />
                        <Route
                          path="/e-belgeler/iptaller"
                          element={<EDocumentListPage title="İptaller / İade" status="CANCELLED" />}
                        />
                        <Route path="/e-belgeler/sorgula" element={<EDocumentSearchPage />} />
                        <Route path="/e-belgeler/ayarlar" element={<EDocumentSettingsPage />} />
                        <Route path="/e-belgeler/yeni" element={<EDocumentComposePage />} />
                        <Route path="/e-belgeler/:id" element={<EDocumentDetailPage />} />
                        <Route path="/ayarlar/e-donusum" element={<EDocumentSettingsPage />} />
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
                        <Route
                          path="/personel"
                          element={<Navigate to="/ik/personeller" replace />}
                        />
                        <Route
                          path="/giderler/calisanlar"
                          element={<Navigate to="/ik/personeller" replace />}
                        />

                        <Route path="/sosyal-medya" element={<SocialMediaDashboardPage />} />
                        <Route path="/sosyal-medya/hesaplar" element={<SocialAccountsPage />} />
                        <Route
                          path="/sosyal-medya/meta-kurulum"
                          element={<SocialMetaSetupPage />}
                        />
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
                        <Route
                          path="/ai-buyume"
                          element={<Navigate to="/sosyal-medya" replace />}
                        />
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
                        <Route
                          path="/giderler"
                          element={<Navigate to="/giderler/liste" replace />}
                        />
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
                        <Route
                          path="/crm/not/:id/duzenle"
                          element={<CrmCreatePage type="note" />}
                        />
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
                        <Route
                          path="/belge-merkezi/localization"
                          element={<DocLocalizationPage />}
                        />
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
                          path="/surecler-raporlari"
                          element={
                            <PageSuspense>
                              <ProcessReportsPage />
                            </PageSuspense>
                          }
                        />
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
                        <Route
                          path="/lojistik/tir-sevkiyat"
                          element={
                            <PageSuspense>
                              <TirSevkiyatPage />
                            </PageSuspense>
                          }
                        />
                        <Route
                          path="/lojistik/tir-sevkiyat/:shipmentId"
                          element={
                            <PageSuspense>
                              <TirSevkiyatDetailPage />
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
                            <TreasuryTypeReportPage
                              accountType="Banka Hesabı"
                              title="Banka Raporu"
                            />
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
                            <TreasuryTypeReportPage
                              accountType="Senet Kasası"
                              title="Senet Raporu"
                            />
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
                        <Route path="/ayarlar/kullanicilar" element={<TeamUsersPage />} />
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
                        <Route
                          path="/ayarlar/kurumsal-yapi/subeler"
                          element={<OrgBranchesPage />}
                        />
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
                            <CostCalculatorRoute
                              variant="baklava"
                              moduleId="baklavaCostCalculator"
                            />
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
                    </LazyScreen>
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
