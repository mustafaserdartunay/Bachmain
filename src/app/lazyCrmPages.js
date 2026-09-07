import { lazyPage } from '../components/Common/PageSuspense'

function named(importer, exportName) {
  return lazyPage(() => importer().then((mod) => ({ default: mod[exportName] })))
}

/** Route pages load on demand so Güncel Durum does not parse the whole CRM. */

export const LicensePage = lazyPage(() => import('../pages/auth/LicensePage'))
export const TrialExpiredPage = lazyPage(() => import('../pages/auth/TrialExpiredPage'))
export const OnboardingWizard = lazyPage(() => import('../pages/onboarding/OnboardingWizard'))
export const CashPage = lazyPage(() => import('../pages/CashPage'))
export const ChequesPage = lazyPage(() => import('../pages/treasury/ChequesPage'))
export const PromissoryNotesPage = lazyPage(() => import('../pages/treasury/PromissoryNotesPage'))
export const TreasuryAccountsListPage = lazyPage(
  () => import('../pages/treasury/TreasuryAccountsListPage'),
)
export const TreasuryTypeReportPage = lazyPage(
  () => import('../pages/treasury/TreasuryTypeReportPage'),
)
export const CashBankReportPage = lazyPage(() => import('../pages/treasury/CashBankReportPage'))
export const CashFlowReportPage = lazyPage(() => import('../pages/treasury/CashFlowReportPage'))
export const CustomerCreatePage = lazyPage(() => import('../pages/CustomerCreatePage'))
export const MasterDataHubPage = lazyPage(() => import('../pages/MasterDataHubPage'))
export const WorkflowHubPage = lazyPage(() => import('../pages/WorkflowHubPage'))
export const AiosHubPage = lazyPage(() => import('../pages/AiosHubPage'))
export const BachySettingsPage = lazyPage(() => import('../pages/BachySettingsPage'))
export const AiEnterpriseOrgPage = lazyPage(() => import('../pages/AiEnterpriseOrgPage'))
export const AiAutonomousCompanyPage = lazyPage(() => import('../pages/AiAutonomousCompanyPage'))
export const AiAppBuilderPage = lazyPage(() => import('../pages/AiAppBuilderPage'))
export const KnowledgeCenterPage = lazyPage(() => import('../pages/KnowledgeCenterPage'))
export const DigitalTwinCenterPage = lazyPage(() => import('../pages/DigitalTwinCenterPage'))
export const ManufacturingCenterPage = lazyPage(
  () => import('../pages/mes/ManufacturingCenterPage'),
)
export const MesOperatorTabletPage = lazyPage(() => import('../pages/mes/MesOperatorTabletPage'))
export const FinanceCenterPage = lazyPage(() => import('../pages/FinanceCenterPage'))
export const AnalyticsCenterPage = lazyPage(() => import('../pages/AnalyticsCenterPage'))
export const CustomerExperienceCloudPage = lazyPage(
  () => import('../pages/CustomerExperienceCloudPage'),
)
export const CustomerDetailPage = lazyPage(() => import('../pages/CustomerDetailPage'))
export const CustomerLoadShipmentCreatePage = lazyPage(
  () => import('../pages/CustomerLoadShipmentCreatePage'),
)
export const CustomerMovementDetailPage = lazyPage(
  () => import('../pages/CustomerMovementDetailPage'),
)
export const CustomerDocumentPage = lazyPage(() => import('../pages/CustomerDocumentPage'))
export const CustomerFinderPage = lazyPage(() => import('../pages/CustomerFinderPage'))
export const CustomersPage = lazyPage(() => import('../pages/CustomersPage'))
export const SuppliersPage = lazyPage(() => import('../pages/SuppliersPage'))
export const SalesInvoicesPage = lazyPage(() => import('../pages/SalesInvoicesPage'))
export const SalesReportPage = lazyPage(() => import('../pages/SalesReportPage'))
export const CollectionsReportPage = lazyPage(() => import('../pages/CollectionsReportPage'))
export const IncomeExpenseReportPage = lazyPage(() => import('../pages/IncomeExpenseReportPage'))
export const ExpenseListPage = lazyPage(() => import('../pages/expenses/ExpenseListPage'))
export const LoanPaymentsPage = lazyPage(() => import('../pages/expenses/LoanPaymentsPage'))
export const IncomingEInvoicesPage = lazyPage(
  () => import('../pages/expenses/IncomingEInvoicesPage'),
)
export const IncomingEInvoiceDetailPage = lazyPage(
  () => import('../pages/expenses/IncomingEInvoiceDetailPage'),
)
export const EDocumentsHubPage = lazyPage(() => import('../pages/edocuments/EDocumentsHubPage'))
export const EDocumentListPage = lazyPage(() => import('../pages/edocuments/EDocumentListPage'))
export const EDocumentDetailPage = lazyPage(() => import('../pages/edocuments/EDocumentDetailPage'))
export const EDocumentComposePage = lazyPage(
  () => import('../pages/edocuments/EDocumentComposePage'),
)
export const EDocumentSettingsPage = lazyPage(
  () => import('../pages/edocuments/EDocumentSettingsPage'),
)
export const EDocumentSearchPage = lazyPage(() => import('../pages/edocuments/EDocumentSearchPage'))
export const ExpensesReportPage = lazyPage(() => import('../pages/expenses/ExpensesReportPage'))
export const PaymentsReportPage = lazyPage(() => import('../pages/expenses/PaymentsReportPage'))
export const VatReportPage = lazyPage(() => import('../pages/expenses/VatReportPage'))
export const PersonnelPage = lazyPage(() => import('../pages/PersonnelPage'))
export const ProductionCreatePage = lazyPage(() => import('../pages/ProductionCreatePage'))
export const ProductionDetailPage = lazyPage(() => import('../pages/ProductionDetailPage'))
export const ProjectsPage = lazyPage(() => import('../pages/ProjectsPage'))
export const ProjectsListPage = lazyPage(() => import('../pages/ProjectsListPage'))
export const ShoppingPage = lazyPage(() => import('../pages/ShoppingPage'))
export const QuotesPage = lazyPage(() => import('../pages/QuotesPage'))
export const OrdersPage = lazyPage(() => import('../pages/OrdersPage'))
export const ProductionPage = lazyPage(() => import('../pages/ProductionPage'))
export const ProcessReportsPage = lazyPage(() => import('../pages/ProcessReportsPage'))
export const DepoPageLazy = lazyPage(() => import('../pages/process/DepoPage'))
export const SevkiyatPageLazy = lazyPage(() => import('../pages/process/SevkiyatPage'))
export const WorkflowDesignerPage = lazyPage(() => import('../pages/WorkflowDesignerPage'))
export const TruckLoadCalculatorPage = lazyPage(
  () => import('../components/Logistics/TruckLoadCalculator'),
)
export const TirSevkiyatPage = lazyPage(() => import('../pages/logistics/TirSevkiyatPage'))
export const TirSevkiyatDetailPage = lazyPage(
  () => import('../pages/logistics/TirSevkiyatDetailPage'),
)
export const LiveOperationsPage = lazyPage(() => import('../pages/live/LiveOperationsPage'))
export const LiveFieldPage = lazyPage(() => import('../pages/live/LiveFieldPage'))
export const MapboxSettingsPage = lazyPage(() => import('../pages/settings/MapboxSettingsPage'))
export const ProductsPage = lazyPage(() => import('../pages/stock/ProductsPage'))
export const WarehousesPage = lazyPage(() => import('../pages/stock/WarehousesPage'))
export const WarehouseTransferPage = lazyPage(() => import('../pages/stock/WarehouseTransferPage'))
export const OutgoingWaybillPage = lazyPage(() => import('../pages/stock/OutgoingWaybillPage'))
export const IncomingWaybillPage = lazyPage(() => import('../pages/stock/IncomingWaybillPage'))
export const PriceListsPage = lazyPage(() => import('../pages/stock/PriceListsPage'))
export const StockHistoryPage = lazyPage(() => import('../pages/stock/StockHistoryPage'))
export const StockProductsReportPage = lazyPage(
  () => import('../pages/stock/StockProductsReportPage'),
)
export const CostCalculatorRoute = lazyPage(() => import('../pages/stock/CostCalculatorRoute'))
export const DeliveredPage = lazyPage(() => import('../pages/process/DeliveredPage'))
export const SettingsPage = lazyPage(() => import('../pages/SettingsPage'))
export const TeamUsersPage = lazyPage(() => import('../pages/settings/TeamUsersPage'))
export const LabelsSettingsPage = lazyPage(() => import('../pages/LabelsSettingsPage'))
export const TagLabelsSettingsPage = lazyPage(() => import('../pages/TagLabelsSettingsPage'))
export const CashBankSettingsPage = lazyPage(() => import('../pages/CashBankSettingsPage'))
export const ProfilePage = lazyPage(() => import('../pages/ProfilePage'))
export const VersionPage = lazyPage(() => import('../pages/VersionPage'))
export const PackagesPage = lazyPage(() => import('../pages/billing/PackagesPage'))
export const AnnouncementsPage = lazyPage(() => import('../pages/AnnouncementsPage'))
export const TrainingPage = lazyPage(() => import('../pages/TrainingPage'))
export const AdminControlPage = lazyPage(() => import('../pages/AdminControlPage'))
export const CustomerPortalPage = lazyPage(() => import('../pages/portal/CustomerPortalPage'))
export const OmnichannelPage = lazyPage(() => import('../pages/OmnichannelPage'))
export const CrmPage = lazyPage(() => import('../pages/CrmPage'))
export const CrmCreatePage = lazyPage(() => import('../pages/CrmCreatePage'))
export const FieldSalesPage = lazyPage(() => import('../pages/FieldSalesPage'))
export const PdksDashboardPage = lazyPage(() => import('../pages/hr/PdksDashboardPage'))
export const AttendanceTrackingPage = lazyPage(() => import('../pages/hr/AttendanceTrackingPage'))
export const ShiftsPage = lazyPage(() => import('../pages/hr/ShiftsPage'))
export const LeavesPage = lazyPage(() => import('../pages/hr/LeavesPage'))
export const OvertimePage = lazyPage(() => import('../pages/hr/OvertimePage'))
export const AbsencesPage = lazyPage(() => import('../pages/hr/AbsencesPage'))
export const TaskTrackingPage = lazyPage(() => import('../pages/hr/TaskTrackingPage'))
export const MapTrackingPage = lazyPage(() => import('../pages/hr/MapTrackingPage'))
export const MobileCheckInPage = lazyPage(() => import('../pages/hr/MobileCheckInPage'))
export const PdksSettingsPage = lazyPage(() => import('../pages/hr/PdksSettingsPage'))
export const AiSettingsHubPage = lazyPage(() => import('../pages/settings/AiSettingsHubPage'))
export const OpenAiSettingsPage = lazyPage(() => import('../pages/settings/OpenAiSettingsPage'))
export const SalesRepresentativesPage = lazyPage(
  () => import('../pages/fieldSales/SalesRepresentativesPage'),
)
export const SalesRepReportsPage = lazyPage(() => import('../pages/fieldSales/SalesRepReportsPage'))
export const CourierTrackingPage = lazyPage(() => import('../pages/CourierTrackingPage'))
export const CustomerCourierTrackingPage = lazyPage(
  () => import('../pages/portal/CustomerCourierTrackingPage'),
)
export const SevkiyatTrackingPage = lazyPage(() => import('../pages/portal/SevkiyatTrackingPage'))
export const SectoralSettingsPage = lazyPage(() => import('../pages/SectoralSettingsPage'))
export const SectoralCategorySettingsPage = lazyPage(
  () => import('../pages/SectoralCategorySettingsPage'),
)
export const GuncelDurumSettingsPage = lazyPage(() => import('../pages/GuncelDurumSettingsPage'))
export const TaxVatSettingsPage = lazyPage(() => import('../pages/TaxVatSettingsPage'))
export const DocumentCenterPage = lazyPage(
  () => import('../pages/documentCenter/DocumentCenterPage'),
)
export const DocTemplatesPage = lazyPage(() => import('../pages/documentCenter/DocTemplatesPage'))
export const DocTemplateDesignerPage = lazyPage(
  () => import('../pages/documentCenter/DocTemplateDesignerPage'),
)
export const DocLabelDesignerPage = lazyPage(
  () => import('../pages/documentCenter/DocLabelDesignerPage'),
)
export const DocPrintPage = lazyPage(() => import('../pages/documentCenter/DocPrintPage'))
export const DocPrintJobsPage = lazyPage(() => import('../pages/documentCenter/DocPrintJobsPage'))
export const DocPrintProfilesPage = lazyPage(
  () => import('../pages/documentCenter/DocPrintProfilesPage'),
)
export const WebStudioPaymentPage = lazyPage(() => import('../pages/web/WebStudioPaymentPage'))
export const WebStudioSettingsPage = lazyPage(() => import('../pages/web/WebStudioSettingsPage'))
export const WebStudioCategoryCreatePage = lazyPage(
  () => import('../pages/web/WebStudioCategoryCreatePage'),
)
export const WebStudioProductCreatePage = lazyPage(
  () => import('../pages/web/WebStudioProductCreatePage'),
)
export const WebStudioTemplatePage = lazyPage(() => import('../pages/web/WebStudioTemplatePage'))
export const WebStudioOrdersPage = lazyPage(() => import('../pages/web/WebStudioOrdersPage'))
export const WebStudioDomainConnectPage = lazyPage(
  () => import('../pages/web/WebStudioDomainConnectPage'),
)
export const WebStudioPage = lazyPage(() => import('../pages/web/WebStudioPage'))
export const WebStudioBuilderPage = lazyPage(() => import('../pages/web/WebStudioBuilderPage'))
export const StandaloneStudioPage = lazyPage(() => import('../pages/web/StandaloneStudioPage'))
export const WebStorefrontPublishPage = lazyPage(
  () => import('../pages/web/WebStorefrontPublishPage'),
)

export const LegacyCostCalculatorRedirect = named(
  () => import('../pages/stock/CostCalculatorRoute'),
  'LegacyCostCalculatorRedirect',
)
export const OrgHubPage = named(() => import('../pages/org/OrgStructurePages'), 'OrgHubPage')
export const OrgCompaniesPage = named(
  () => import('../pages/org/OrgStructurePages'),
  'OrgCompaniesPage',
)
export const OrgBranchesPage = named(
  () => import('../pages/org/OrgStructurePages'),
  'OrgBranchesPage',
)
export const OrgWarehousesPage = named(
  () => import('../pages/org/OrgStructurePages'),
  'OrgWarehousesPage',
)
export const OrgDepartmentsPage = named(
  () => import('../pages/org/OrgStructurePages'),
  'OrgDepartmentsPage',
)
export const OrgUserPermissionsPage = named(
  () => import('../pages/org/OrgStructurePages'),
  'OrgUserPermissionsPage',
)
export const OrgCompanySettingsPage = named(
  () => import('../pages/org/OrgStructurePages'),
  'OrgCompanySettingsPage',
)
export const MyPlanPage = named(() => import('../pages/billing/BillingPages'), 'MyPlanPage')
export const BuyPlanPage = named(() => import('../pages/billing/BillingPages'), 'BuyPlanPage')
export const CheckoutPage = named(() => import('../pages/billing/BillingPages'), 'CheckoutPage')
export const LogisticsDashboardPage = named(
  () => import('../pages/logistics/LogisticsFlowPages'),
  'LogisticsDashboardPage',
)
export const PlannedLogisticsPage = named(
  () => import('../pages/logistics/LogisticsFlowPages'),
  'PlannedLogisticsPage',
)
export const InTransitLogisticsPage = named(
  () => import('../pages/logistics/LogisticsFlowPages'),
  'InTransitLogisticsPage',
)
export const DeliveredLogisticsPage = named(
  () => import('../pages/logistics/LogisticsFlowPages'),
  'DeliveredLogisticsPage',
)
export const SocialMediaDashboardPage = named(
  () => import('../pages/social/SocialMediaPages'),
  'SocialMediaDashboardPage',
)
export const SocialAccountsPage = named(
  () => import('../pages/social/SocialMediaPages'),
  'SocialAccountsPage',
)
export const SocialAiCreatorPage = named(
  () => import('../pages/social/SocialMediaPages'),
  'SocialAiCreatorPage',
)
export const SocialContentStudioPage = named(
  () => import('../pages/social/SocialMediaPages'),
  'SocialContentStudioPage',
)
export const SocialMediaLibraryPage = named(
  () => import('../pages/social/SocialMediaPages'),
  'SocialMediaLibraryPage',
)
export const SocialCampaignsPage = named(
  () => import('../pages/social/SocialMediaPages'),
  'SocialCampaignsPage',
)
export const SocialSchedulerPage = named(
  () => import('../pages/social/SocialMediaPages'),
  'SocialSchedulerPage',
)
export const SocialCalendarPage = named(
  () => import('../pages/social/SocialMediaPages'),
  'SocialCalendarPage',
)
export const SocialTemplatesPage = named(
  () => import('../pages/social/SocialMediaPages'),
  'SocialTemplatesPage',
)
export const SocialBrandKitPage = named(
  () => import('../pages/social/SocialMediaPages'),
  'SocialBrandKitPage',
)
export const SocialApprovalPage = named(
  () => import('../pages/social/SocialMediaPages'),
  'SocialApprovalPage',
)
export const SocialQueuePage = named(
  () => import('../pages/social/SocialMediaPages'),
  'SocialQueuePage',
)
export const SocialAnalyticsPage = named(
  () => import('../pages/social/SocialMediaPages'),
  'SocialAnalyticsPage',
)
export const SocialCommentsPage = named(
  () => import('../pages/social/SocialMediaPages'),
  'SocialCommentsPage',
)
export const SocialMessagesPage = named(
  () => import('../pages/social/SocialMediaPages'),
  'SocialMessagesPage',
)
export const SocialSettingsPage = named(
  () => import('../pages/social/SocialMediaPages'),
  'SocialSettingsPage',
)
export const SocialMetaSetupPage = named(
  () => import('../pages/social/SocialMediaPages'),
  'SocialMetaSetupPage',
)
export const DocArchivePage = named(
  () => import('../pages/documentCenter/DocCenterModules'),
  'DocArchivePage',
)
export const DocAiDesignerPage = named(
  () => import('../pages/documentCenter/DocCenterModules'),
  'DocAiDesignerPage',
)
export const DocApprovalPage = named(
  () => import('../pages/documentCenter/DocCenterModules'),
  'DocApprovalPage',
)
export const DocAssetsPage = named(
  () => import('../pages/documentCenter/DocCenterModules'),
  'DocAssetsPage',
)
export const DocBarcodeDesignerPage = named(
  () => import('../pages/documentCenter/DocCenterModules'),
  'DocBarcodeDesignerPage',
)
export const DocComponentsPage = named(
  () => import('../pages/documentCenter/DocCenterModules'),
  'DocComponentsPage',
)
export const DocEmailTemplatesPage = named(
  () => import('../pages/documentCenter/DocCenterModules'),
  'DocEmailTemplatesPage',
)
export const DocFontsPage = named(
  () => import('../pages/documentCenter/DocCenterModules'),
  'DocFontsPage',
)
export const DocLocalizationPage = named(
  () => import('../pages/documentCenter/DocCenterModules'),
  'DocLocalizationPage',
)
export const DocMarketplacePage = named(
  () => import('../pages/documentCenter/DocCenterModules'),
  'DocMarketplacePage',
)
export const DocPdfDesignerPage = named(
  () => import('../pages/documentCenter/DocCenterModules'),
  'DocPdfDesignerPage',
)
export const DocPermissionsPage = named(
  () => import('../pages/documentCenter/DocCenterModules'),
  'DocPermissionsPage',
)
export const DocQrDesignerPage = named(
  () => import('../pages/documentCenter/DocCenterModules'),
  'DocQrDesignerPage',
)
export const DocSmsTemplatesPage = named(
  () => import('../pages/documentCenter/DocCenterModules'),
  'DocSmsTemplatesPage',
)
export const DocThemesPage = named(
  () => import('../pages/documentCenter/DocCenterModules'),
  'DocThemesPage',
)
export const DocVariablesPage = named(
  () => import('../pages/documentCenter/DocCenterModules'),
  'DocVariablesPage',
)
export const DocVersionsPage = named(
  () => import('../pages/documentCenter/DocCenterModules'),
  'DocVersionsPage',
)
export const DocWhatsAppTemplatesPage = named(
  () => import('../pages/documentCenter/DocCenterModules'),
  'DocWhatsAppTemplatesPage',
)
export const DocWorkflowPage = named(
  () => import('../pages/documentCenter/DocCenterModules'),
  'DocWorkflowPage',
)
