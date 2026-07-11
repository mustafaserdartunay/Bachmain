import { Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { DashboardPage } from '@/pages/DashboardPage'
import { CustomerDetailPage } from '@/pages/CustomerDetailPage'
import { SupportDetailPage } from '@/pages/SupportDetailPage'
import { ModuleListPage } from '@/components/module/ModuleListPage'
import { ModuleDetailPage } from '@/components/module/ModuleDetailPage'
import { ModuleFormPage } from '@/components/module/ModuleFormPage'
import { moduleConfigs } from '@/data/modules'

const moduleIds = Object.keys(moduleConfigs)

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<DashboardPage />} />

        {/* Müşteri özel rotaları */}
        <Route path="musteriler" element={<ModuleListPage moduleId="customers" />} />
        <Route path="musteriler/yeni" element={<ModuleFormPage moduleId="customers" mode="create" />} />
        <Route path="musteriler/:id" element={<CustomerDetailPage />} />
        <Route path="musteriler/:id/duzenle" element={<ModuleFormPage moduleId="customers" mode="edit" />} />

        {/* Destek özel rotaları */}
        <Route path="destek" element={<ModuleListPage moduleId="support" />} />
        <Route path="destek/yeni" element={<ModuleFormPage moduleId="support" mode="create" />} />
        <Route path="destek/:id" element={<SupportDetailPage />} />
        <Route path="destek/:id/duzenle" element={<ModuleFormPage moduleId="support" mode="edit" />} />

        {/* Diğer modüller */}
        {moduleIds
          .filter((id) => id !== 'customers' && id !== 'support')
          .map((id) => {
            const config = moduleConfigs[id]
            const segment = config.path.replace(/^\//, '')
            return (
              <Route key={id}>
                <Route path={segment} element={<ModuleListPage moduleId={id} />} />
                <Route path={`${segment}/yeni`} element={<ModuleFormPage moduleId={id} mode="create" />} />
                <Route path={`${segment}/:itemId`} element={<ModuleDetailPage moduleId={id} />} />
                <Route path={`${segment}/:itemId/duzenle`} element={<ModuleFormPage moduleId={id} mode="edit" />} />
              </Route>
            )
          })}

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
