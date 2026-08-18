import { Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { DashboardPage } from '@/pages/DashboardPage'
import { CustomerDetailPage } from '@/pages/CustomerDetailPage'
import { SupportDetailPage } from '@/pages/SupportDetailPage'
import { PlatformOpsPage } from '@/pages/PlatformOpsPage'
import { UserManagementPage } from '@/pages/UserManagementPage'
import { AuditLogPage } from '@/pages/AuditLogPage'
import { SecurityCenterPage } from '@/pages/SecurityCenterPage'
import {
  BillingCampaignsPage,
  BillingCouponsPage,
  BillingHistoryPage,
  BillingInvoicesPage,
  BillingModulesPage,
  BillingPaymentsPage,
  BillingPlansPage,
  BillingPricingPage,
  BillingRenewalsPage,
  BillingSubscriptionsPage,
  BillingTrialsPage,
} from '@/pages/billing/BillingPages'
import { MailCenterPage } from '@/pages/mail/MailCenterPage'
import { AiControlCenterPage } from '@/pages/AiControlCenterPage'
import { MembershipsPage } from '@/pages/MembershipsPage'
import { MembershipDetailPage } from '@/pages/MembershipDetailPage'
import { SupportInboxPage } from '@/pages/SupportInboxPage'
import { LegalContentPage } from '@/pages/LegalContentPage'
import { AnnouncementsAdminPage } from '@/pages/AnnouncementsAdminPage'
import { QualityControlPage } from '@/pages/QualityControlPage'
import { SocialConnectionsPage } from '@/pages/SocialConnectionsPage'
import { EdonusumPage } from '@/pages/EdonusumPage'
import { ModuleListPage } from '@/components/module/ModuleListPage'
import { ModuleDetailPage } from '@/components/module/ModuleDetailPage'
import { ModuleFormPage } from '@/components/module/ModuleFormPage'
import { StaffLoginPage, RequireStaff } from '@/pages/StaffLoginPage'
import { moduleConfigs } from '@/data/modules'

const moduleIds = Object.keys(moduleConfigs)

export function AppRoutes() {
  return (
    <Routes>
      <Route path="giris" element={<StaffLoginPage />} />

      <Route
        element={
          <RequireStaff>
            <AppShell />
          </RequireStaff>
        }
      >
        <Route index element={<DashboardPage />} />

        <Route path="platform-ops" element={<PlatformOpsPage />} />
        <Route path="kalite-kontrol" element={<QualityControlPage />} />
        <Route path="sosyal-baglantilar" element={<SocialConnectionsPage />} />
        <Route path="e-donusum" element={<EdonusumPage />} />
        <Route path="ayarlar/e-donusum" element={<EdonusumPage />} />
        <Route path="user-management" element={<UserManagementPage />} />
        <Route path="audit-logs" element={<AuditLogPage />} />
        <Route path="guvenlik" element={<SecurityCenterPage />} />
        <Route path="ai-yonetimi" element={<AiControlCenterPage />} />
        <Route path="ai-control" element={<Navigate to="/ai-yonetimi" replace />} />

        <Route path="abonelik/paketler" element={<BillingPlansPage />} />
        <Route path="abonelik/moduller" element={<BillingModulesPage />} />
        <Route path="abonelik/fiyatlandirma" element={<BillingPricingPage />} />
        <Route path="abonelik/kampanyalar" element={<BillingCampaignsPage />} />
        <Route path="abonelik/kuponlar" element={<BillingCouponsPage />} />
        <Route path="abonelik/deneme" element={<BillingTrialsPage />} />
        <Route path="abonelik/abonelikler" element={<BillingSubscriptionsPage />} />
        <Route path="abonelik/odemeler" element={<BillingPaymentsPage />} />
        <Route path="abonelik/faturalar" element={<BillingInvoicesPage />} />
        <Route path="abonelik/yenilemeler" element={<BillingRenewalsPage />} />
        <Route path="abonelik/loglar" element={<BillingHistoryPage />} />

        <Route path="eposta" element={<MailCenterPage />} />

        <Route path="musteriler" element={<ModuleListPage moduleId="customers" />} />
        <Route
          path="musteriler/yeni"
          element={<ModuleFormPage moduleId="customers" mode="create" />}
        />
        <Route path="musteriler/:id" element={<CustomerDetailPage />} />
        <Route
          path="musteriler/:id/duzenle"
          element={<ModuleFormPage moduleId="customers" mode="edit" />}
        />

        <Route path="uyeler" element={<MembershipsPage />} />
        <Route
          path="uyeler/yeni"
          element={<ModuleFormPage moduleId="memberships" mode="create" />}
        />
        <Route path="uyeler/:id" element={<MembershipDetailPage />} />
        <Route
          path="uyeler/:id/duzenle"
          element={<ModuleFormPage moduleId="memberships" mode="edit" />}
        />

        <Route path="hukuki" element={<LegalContentPage />} />
        <Route path="duyurular" element={<AnnouncementsAdminPage />} />
        <Route path="egitim-duyurulari" element={<AnnouncementsAdminPage />} />
        <Route path="paket-duyurulari" element={<AnnouncementsAdminPage />} />

        <Route path="destek" element={<SupportInboxPage />} />
        <Route path="destek/yeni" element={<ModuleFormPage moduleId="support" mode="create" />} />
        <Route path="destek/:id" element={<SupportDetailPage />} />
        <Route
          path="destek/:id/duzenle"
          element={<ModuleFormPage moduleId="support" mode="edit" />}
        />

        {moduleIds
          .filter(
            (id) =>
              id !== 'customers' && id !== 'support' && id !== 'security' && id !== 'memberships',
          )
          .flatMap((id) => {
            const config = moduleConfigs[id]
            const segment = config.path.replace(/^\//, '')
            return [
              <Route
                key={`${id}-list`}
                path={segment}
                element={<ModuleListPage moduleId={id} />}
              />,
              <Route
                key={`${id}-new`}
                path={`${segment}/yeni`}
                element={<ModuleFormPage moduleId={id} mode="create" />}
              />,
              <Route
                key={`${id}-detail`}
                path={`${segment}/:itemId`}
                element={<ModuleDetailPage moduleId={id} />}
              />,
              <Route
                key={`${id}-edit`}
                path={`${segment}/:itemId/duzenle`}
                element={<ModuleFormPage moduleId={id} mode="edit" />}
              />,
            ]
          })}

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
