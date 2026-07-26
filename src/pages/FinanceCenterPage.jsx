import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Banknote,
  BookOpen,
  Bot,
  Building2,
  FileText,
  LineChart,
  Receipt,
  Scale,
  Sparkles,
  Wallet,
  Workflow,
} from 'lucide-react'
import { AppPageHeader, AppPageShell } from '../components/Layout/AppPageLayout'
import { APP_SURFACE_PANEL_CLASS } from '../utils/dashboardDesign'
import { CASH_BASE_PATH } from '../data/treasuryMenu'
import { financeSubMenus } from '../data/financeMenu'
import { publishDomainEvent } from '../workflow/eventBus'
import {
  FINANCE_UPDATED_EVENT,
  addAssetLocal,
  addBudgetLocal,
  addCostLocal,
  addReconLocal,
  aiCollectionsLocal,
  aiInsightsLocal,
  balanceSheetLocal,
  ensureFinanceSeed,
  financeOverviewLocal,
  incomeLocal,
  listAccountsLocal,
  listAssetsLocal,
  listBudgetsLocal,
  listCostsLocal,
  listJournalsLocal,
  listReconLocal,
  projectJournalLocal,
} from '../finance/localStore'

function money(n) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(n)
}

function Kpi({ label, value, to }) {
  const body = (
    <div className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
      <p className="text-[11px] font-bold uppercase text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-xl font-black tabular-nums text-[var(--ink)]">{value}</p>
    </div>
  )
  return to ? (
    <Link to={to} className="block">
      {body}
    </Link>
  ) : (
    body
  )
}

export default function FinanceCenterPage() {
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') || 'dashboard'
  const [msg, setMsg] = useState('')
  const [accounts, setAccounts] = useState([])
  const [journals, setJournals] = useState([])
  const [budgets, setBudgets] = useState([])
  const [costs, setCosts] = useState([])
  const [assets, setAssets] = useState([])
  const [recon, setRecon] = useState([])

  const overview = useMemo(() => financeOverviewLocal(), [msg])
  const insights = useMemo(() => aiInsightsLocal(), [])
  const collections = useMemo(() => aiCollectionsLocal(), [])
  const bs = useMemo(() => balanceSheetLocal(), [])
  const pl = useMemo(() => incomeLocal(), [])

  function refresh() {
    setAccounts(listAccountsLocal())
    setJournals(listJournalsLocal())
    setBudgets(listBudgetsLocal())
    setCosts(listCostsLocal())
    setAssets(listAssetsLocal())
    setRecon(listReconLocal())
  }

  useEffect(() => {
    ensureFinanceSeed()
    refresh()
    const fn = () => refresh()
    window.addEventListener(FINANCE_UPDATED_EVENT, fn)
    return () => window.removeEventListener(FINANCE_UPDATED_EVENT, fn)
  }, [])

  function setTab(id) {
    const next = new URLSearchParams(params)
    if (id === 'dashboard') next.delete('tab')
    else next.set('tab', id)
    setParams(next, { replace: true })
  }

  function flash(t) {
    setMsg(t)
    setTimeout(() => setMsg(''), 2000)
  }

  return (
    <AppPageShell>
      <AppPageHeader
        title="Finance Center"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              to={CASH_BASE_PATH}
              className="inline-flex min-h-11 items-center gap-2 rounded-2xl border px-3 text-xs font-black uppercase"
            >
              <Wallet className="h-4 w-4" /> Nakit
            </Link>
            <Link
              to="/musteriler/faturalar"
              className="inline-flex min-h-11 items-center gap-2 rounded-2xl border px-3 text-xs font-black uppercase"
            >
              <Receipt className="h-4 w-4" /> Faturalar
            </Link>
            <Link
              to="/otomasyon"
              className="inline-flex min-h-11 items-center gap-2 rounded-2xl border px-3 text-xs font-black uppercase"
            >
              <Workflow className="h-4 w-4" /> Workflow
            </Link>
            <Link
              to="/aios"
              className="inline-flex min-h-11 items-center gap-2 rounded-2xl border px-3 text-xs font-black uppercase"
            >
              <Bot className="h-4 w-4" /> AIOS
            </Link>
          </div>
        }
      />

      <div className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
        <p className="text-sm text-[var(--ink)]">
          BachMain Financial Suite — muhasebe fiş değil; ERP/CRM/MES/Commerce ile entegre finans.
          Nakit ve fatura bakiyeleri <strong>tek SoT</strong>; GL projeksiyon katmanıdır.
        </p>
        {msg ? <p className="mt-2 text-xs font-bold text-emerald-600">{msg}</p> : null}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {financeSubMenus.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`min-h-10 rounded-xl border px-2.5 text-[11px] font-black uppercase ${
              tab === t.id
                ? 'border-[var(--ink)]/20 bg-white/55 text-[var(--ink)]'
                : 'border-dark-500/30 text-[var(--muted)]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi label="Kasa" value={money(overview.cashOnHand)} to={CASH_BASE_PATH} />
            <Kpi label="Banka" value={money(overview.bankBalance)} to="/nakit/bankalar" />
            <Kpi label="Alacak" value={money(overview.receivables)} to="/musteriler/faturalar" />
            <Kpi label="Borç" value={money(overview.payables)} to="/giderler/liste" />
            <Kpi
              label="Aylık giriş"
              value={money(overview.monthlyInflow)}
              to="/nakit/nakit-akisi-raporu"
            />
            <Kpi label="Aylık çıkış" value={money(overview.monthlyOutflow)} />
            <Kpi label="KDV" value={money(overview.vatPayable)} to="/giderler/kdv-raporu" />
            <Kpi label="Bütçe sapması" value={`%${overview.budgetVariancePct}`} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { to: '/ayarlar/master-data', t: 'Master Data', icon: Building2 },
              { to: '/bilgi-merkezi', t: 'Knowledge', icon: BookOpen },
              { to: '/mes', t: 'MES Maliyet', icon: Scale },
            ].map((x) => (
              <Link
                key={x.to}
                to={x.to}
                className={`${APP_SURFACE_PANEL_CLASS} flex min-h-14 items-center gap-2 px-4 text-sm font-bold`}
              >
                <x.icon className="h-4 w-4" /> {x.t}
              </Link>
            ))}
          </div>
        </>
      )}

      {tab === 'gl' && (
        <section className="grid gap-4 lg:grid-cols-2">
          <div className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
            <h2 className="mb-3 text-sm font-black uppercase">Hesap planı</h2>
            <ul className="space-y-2">
              {accounts.map((a) => (
                <li key={a.id || a.code} className="flex justify-between text-sm">
                  <span>
                    {a.code} · {a.name}
                  </span>
                  <span className="text-[11px] uppercase text-[var(--muted)]">{a.type}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className={`${APP_SURFACE_PANEL_CLASS} space-y-3 p-4`}>
            <h2 className="text-sm font-black uppercase">Yevmiye projeksiyonu</h2>
            <p className="text-xs text-[var(--muted)]">
              Fatura/nakit hareketinden yevmiye üretir — bakiye fork etmez.
            </p>
            <button
              type="button"
              className="min-h-12 rounded-2xl border px-4 text-xs font-black uppercase"
              onClick={() => {
                const j = projectJournalLocal({
                  source: 'invoice',
                  amount: 15000,
                  memo: 'Demo satış projeksiyonu',
                  invoiceId: 'inv_demo',
                })
                publishDomainEvent(
                  'trigger.finance.journal.posted',
                  { journalNo: j.journalNo, source: j.source },
                  { source: 'finance' },
                )
                flash('Yevmiye projected')
                refresh()
              }}
            >
              Demo fiş projekte et
            </button>
            {journals.map((j) => (
              <p key={j.id} className="text-sm">
                {j.journalNo} · {j.source} · {money(j.amount)} · {j.status}
              </p>
            ))}
          </div>
        </section>
      )}

      {tab === 'cashflow' && (
        <section className={`${APP_SURFACE_PANEL_CLASS} p-5`}>
          <LineChart className="mb-2 h-5 w-5" />
          <p className="text-sm">
            Operasyonel nakit akışı SoT:{' '}
            <Link to="/nakit/nakit-akisi-raporu" className="font-bold underline">
              Nakit Akışı Raporu
            </Link>
          </p>
          <p className="mt-2 text-xs text-[var(--muted)]">
            AI 30g net: {money(insights.cashForecast30d.net)} (FS-0 stub)
          </p>
        </section>
      )}

      {tab === 'banks' && (
        <section className={`${APP_SURFACE_PANEL_CLASS} space-y-3 p-5`}>
          <p className="text-sm">
            Bankalar / çek / senet SoT:{' '}
            <Link to="/nakit/bankalar" className="font-bold underline">
              Bankalar
            </Link>{' '}
            ·{' '}
            <Link to="/nakit/cekler" className="underline">
              Çekler
            </Link>{' '}
            ·{' '}
            <Link to="/nakit/senetler" className="underline">
              Senetler
            </Link>
          </p>
          <button
            type="button"
            className="min-h-12 rounded-2xl border px-4 text-xs font-black uppercase"
            onClick={() => {
              addReconLocal('BANK-DEMO')
              publishDomainEvent('trigger.finance.reconciliation.opened', {}, { source: 'finance' })
              flash('Mutabakat açıldı')
              refresh()
            }}
          >
            Mutabakat başlat
          </button>
          {recon.map((r) => (
            <p key={r.id} className="text-sm">
              {r.bankAccountRef} · {r.status}
            </p>
          ))}
        </section>
      )}

      {tab === 'budget' && (
        <section className={`${APP_SURFACE_PANEL_CLASS} space-y-3 p-5`}>
          <button
            type="button"
            className="min-h-12 rounded-2xl border px-4 text-xs font-black uppercase"
            onClick={() => {
              addBudgetLocal(`${new Date().getFullYear()} Bütçe`, new Date().getFullYear())
              publishDomainEvent('trigger.finance.budget.created', {}, { source: 'finance' })
              flash('Bütçe eklendi')
              refresh()
            }}
          >
            Bütçe oluştur
          </button>
          {budgets.map((b) => (
            <p key={b.id} className="text-sm">
              {b.name} · {b.year} · {b.status}
            </p>
          ))}
        </section>
      )}

      {tab === 'receivables' && (
        <section className={`${APP_SURFACE_PANEL_CLASS} p-5`}>
          <p className="text-sm">
            Alacak SoT:{' '}
            <Link to="/musteriler/faturalar" className="font-bold underline">
              Satış Faturaları
            </Link>{' '}
            ·{' '}
            <Link to="/musteriler/tahsilat-raporu" className="underline">
              Tahsilat Raporu
            </Link>
          </p>
        </section>
      )}

      {tab === 'payables' && (
        <section className={`${APP_SURFACE_PANEL_CLASS} p-5`}>
          <p className="text-sm">
            Borç / gider SoT:{' '}
            <Link to="/giderler/liste" className="font-bold underline">
              Giderler
            </Link>{' '}
            ·{' '}
            <Link to="/giderler/tedarikciler" className="underline">
              Tedarikçiler
            </Link>
          </p>
        </section>
      )}

      {tab === 'cost' && (
        <section className={`${APP_SURFACE_PANEL_CLASS} space-y-3 p-5`}>
          <p className="text-xs text-[var(--muted)]">
            Ürün / sipariş / makine / operatör / müşteri maliyeti — MES iş emri FK ile.
          </p>
          <button
            type="button"
            className="min-h-12 rounded-2xl border px-4 text-xs font-black uppercase"
            onClick={() => {
              addCostLocal('machine', 'MC-02', '12500')
              publishDomainEvent(
                'trigger.finance.cost.recorded',
                { dimension: 'machine' },
                {
                  source: 'finance',
                },
              )
              flash('Maliyet kaydı')
              refresh()
            }}
          >
            Makine maliyeti ekle
          </button>
          {costs.map((c) => (
            <p key={c.id} className="text-sm">
              {c.dimension}:{c.dimensionId} · {money(Number(c.amount))}
            </p>
          ))}
          <Link to="/mes" className="text-xs font-bold underline">
            Manufacturing Center
          </Link>
        </section>
      )}

      {tab === 'assets' && (
        <section className={`${APP_SURFACE_PANEL_CLASS} space-y-3 p-5`}>
          <button
            type="button"
            className="min-h-12 rounded-2xl border px-4 text-xs font-black uppercase"
            onClick={() => {
              addAssetLocal(`AST-${Date.now().toString().slice(-4)}`, 'Demo Makine')
              flash('Varlık eklendi')
              refresh()
            }}
          >
            Varlık ekle
          </button>
          {assets.map((a) => (
            <p key={a.id} className="text-sm">
              {a.code} · {a.name}
            </p>
          ))}
        </section>
      )}

      {tab === 'tax' && (
        <section className={`${APP_SURFACE_PANEL_CLASS} p-5`}>
          <Link to="/ayarlar/vergi-kdv" className="font-bold underline">
            Vergi / KDV Ayarları
          </Link>
          <span className="mx-2">·</span>
          <Link to="/giderler/kdv-raporu" className="underline">
            KDV Raporu
          </Link>
        </section>
      )}

      {tab === 'einvoice' && (
        <section className={`${APP_SURFACE_PANEL_CLASS} p-5`}>
          <FileText className="mb-2 h-5 w-5" />
          <p className="text-sm">
            Gelen e-fatura:{' '}
            <Link to="/giderler/gelen-e-faturalar" className="font-bold underline">
              Gelen E-Faturalar
            </Link>
          </p>
          <p className="mt-2 text-sm">
            Çıkış faturası kes:{' '}
            <Link to="/musteriler/faturalar/yeni" className="font-bold underline">
              Yeni Fatura Oluştur
            </Link>
          </p>
          <p className="mt-2 text-sm">
            GİB / e-posta ayarları:{' '}
            <Link to="/ayarlar/e-fatura" className="font-bold underline">
              E-Fatura Ayarları
            </Link>
          </p>
          <p className="mt-2 text-xs text-[var(--muted)]">
            e-Fatura ve e-Arşiv kesimi · GİB durumu (gönderiliyor / beklemede / gönderildi) ·
            müşteri e-posta (yolda / ulaştı / açıldı).
          </p>
        </section>
      )}

      {tab === 'eledger' && (
        <section className={`${APP_SURFACE_PANEL_CLASS} p-5`}>
          <p className="text-sm text-[var(--muted)]">
            E-Defter / e-ledger adapter FS-2. Yevmiye projeksiyonu GL sekmesinde.
          </p>
        </section>
      )}

      {tab === 'reports' && (
        <section className="grid gap-4 lg:grid-cols-2">
          <div className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
            <h2 className="mb-2 text-sm font-black uppercase">Bilanço (demo)</h2>
            {bs.assets.map((a) => (
              <p key={a.code} className="text-sm">
                {a.code} {a.name}: {money(a.amount)}
              </p>
            ))}
            <hr className="my-2 border-dark-500/30" />
            {bs.liabilities.map((a) => (
              <p key={a.code} className="text-sm">
                {a.code} {a.name}: {money(a.amount)}
              </p>
            ))}
          </div>
          <div className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
            <h2 className="mb-2 text-sm font-black uppercase">Gelir tablosu (demo)</h2>
            <p className="text-sm">Gelir: {money(pl.revenue)}</p>
            <p className="text-sm">SMM: {money(pl.cogs)}</p>
            <p className="text-sm">Faaliyet: {money(pl.opex)}</p>
            <p className="mt-2 text-lg font-black">Net: {money(pl.netProfit)}</p>
            <Link
              to="/musteriler/gelir-gider-raporu"
              className="mt-3 inline-block text-xs underline"
            >
              Operasyonel gelir-gider
            </Link>
          </div>
        </section>
      )}

      {tab === 'ai' && (
        <section className="grid gap-4 lg:grid-cols-2">
          <div className={`${APP_SURFACE_PANEL_CLASS} space-y-2 p-4`}>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <h2 className="text-sm font-black uppercase">AI Finance</h2>
            </div>
            <p className="text-sm">30g net: {money(insights.cashForecast30d.net)}</p>
            <p className="text-sm">
              Kur riski: ${insights.fxRisk.exposureUsd} · %{insights.fxRisk.riskPct}
            </p>
            <p className="text-sm">
              Tahsilat 7g: {money(insights.collectionForecast.expectedIn7d)} · gecikme %
              {insights.collectionForecast.delayRiskPct}
            </p>
            <p className="text-sm">Marj %{insights.profitability.marginPct}</p>
            <p className="text-sm">Bütçe sapması %{insights.budgetVariance.pct}</p>
          </div>
          <div className={`${APP_SURFACE_PANEL_CLASS} space-y-2 p-4`}>
            <div className="flex items-center gap-2">
              <Banknote className="h-4 w-4" />
              <h2 className="text-sm font-black uppercase">AI Collection</h2>
            </div>
            {collections.overdue.map((o) => (
              <div
                key={o.customerName}
                className="rounded-xl border border-dark-500/30 p-3 text-sm"
              >
                <p className="font-bold">
                  {o.customerName} · {money(o.amount)} · {o.daysOverdue}g
                </p>
                <p className="text-[11px] text-[var(--muted)]">
                  En uygun: {o.bestCallDay} · {o.channels.join(', ')}
                </p>
              </div>
            ))}
            <Link to="/ai-buyume" className="text-xs font-bold underline">
              Growth Center (WA/SMS/Mail)
            </Link>
          </div>
        </section>
      )}
    </AppPageShell>
  )
}
