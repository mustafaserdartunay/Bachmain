import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Header from './components/Header'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'
import {
  FeaturesPage,
  CrmPage,
  ErpPage,
  StockPage,
  FinancePage,
  ReportsPage,
  ModulesPage,
  ProductionPage,
  EcommercePage,
  FieldSalesPage,
  EInvoicePage,
} from './pages/FeaturePages'
import { PricingPage, FaqPage, HelpPage, EducationPage } from './pages/SupportPages'
import { BlogPage, BlogDetailPage } from './pages/BlogPages'
import { LoginPage, DemoPage, ContactPage } from './pages/AuthPages'
import RegisterPage from './pages/RegisterPage'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function App() {
  const { pathname } = useLocation()
  const bareAuth = pathname === '/register'

  return (
    <>
      <ScrollToTop />
      {!bareAuth ? <Header /> : null}
      <main className="pt-0">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/features/crm" element={<CrmPage />} />
          <Route path="/features/erp" element={<ErpPage />} />
          <Route path="/features/stock" element={<StockPage />} />
          <Route path="/features/finance" element={<FinancePage />} />
          <Route path="/features/reports" element={<ReportsPage />} />
          <Route path="/modules" element={<ModulesPage />} />
          <Route path="/modules/production" element={<ProductionPage />} />
          <Route path="/modules/ecommerce" element={<EcommercePage />} />
          <Route path="/modules/field-sales" element={<FieldSalesPage />} />
          <Route path="/e-invoice" element={<EInvoicePage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogDetailPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/demo" element={<DemoPage />} />
          <Route path="/help" element={<HelpPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/egitim" element={<EducationPage />} />
          <Route path="/egitimler" element={<EducationPage />} />
        </Routes>
      </main>
      {!bareAuth ? <Footer /> : null}
    </>
  )
}
