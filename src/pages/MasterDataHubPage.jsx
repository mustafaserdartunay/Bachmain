import { useMemo } from 'react'
import { Database, GitMerge, Search, ShieldAlert, Tags } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getCustomerProfiles } from '../data/customerProfiles'
import { APP_SURFACE_PANEL_CLASS } from '../utils/dashboardDesign'
import { findLocalCustomerDuplicates } from '../utils/mdmDuplicateCheck'

function missingRate(rows, pred) {
  if (!rows.length) return 0
  return Math.round((rows.filter(pred).length / rows.length) * 100)
}

export default function MasterDataHubPage() {
  const profiles = useMemo(() => getCustomerProfiles(), [])

  const quality = useMemo(() => {
    const missingEmail = missingRate(profiles, (r) => !String(r.email || '').trim())
    const missingTax = missingRate(
      profiles,
      (r) => !String(r.taxNo || r.taxNumber || r.vergiNo || '').trim(),
    )
    // Sample pairwise duplicate hints (cap work)
    let dupHints = 0
    const sample = profiles.slice(0, 80)
    for (const row of sample) {
      const matches = findLocalCustomerDuplicates(
        {
          name: row.name || row.company || row.firmaAdi,
          email: row.email,
          phone: row.phone || row.telefon,
          taxNo: row.taxNo || row.taxNumber || row.vergiNo,
        },
        { excludeId: row.id },
      ).filter((m) => m.score >= 0.7)
      if (matches.length) dupHints += 1
    }
    return {
      total: profiles.length,
      missingEmail,
      missingTax,
      dupHints,
    }
  }, [profiles])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">Master Data (MDM)</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Tek gerçek kaynak hedefi — CRM localStorage hâlâ birincil; API MDM katmanı additive
          kuruldu.
        </p>
      </div>

      <div className={`grid gap-4 sm:grid-cols-2 xl:grid-cols-4 ${APP_SURFACE_PANEL_CLASS} p-4`}>
        <Metric icon={Database} label="Müşteri (LS)" value={String(quality.total)} />
        <Metric icon={ShieldAlert} label="E-posta eksik %" value={`%${quality.missingEmail}`} />
        <Metric icon={Tags} label="Vergi no eksik %" value={`%${quality.missingTax}`} />
        <Metric icon={GitMerge} label="Çift aday (örnek)" value={String(quality.dupHints)} />
      </div>

      <div className={`${APP_SURFACE_PANEL_CLASS} space-y-3 p-5`}>
        <h2 className="text-sm font-semibold">Sonraki adımlar</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--text-muted)]">
          <li>Yeni müşteri kaydında çift kayıt uyarısı aktif (MDM duplicate check).</li>
          <li>
            API: <code className="text-xs">/v1/mdm/search</code>,{' '}
            <code className="text-xs">/duplicates</code>, <code className="text-xs">/merge</code>,{' '}
            <code className="text-xs">/quality</code>
          </li>
          <li>
            Migration: <code className="text-xs">apps/api/drizzle/0001_mdm_foundation.sql</code>
          </li>
          <li>
            Doküman: <code className="text-xs">docs/64_MDM_GAP_REPORT.md</code>,{' '}
            <code className="text-xs">docs/65_MDM_ARCHITECTURE_ROADMAP.md</code>
          </li>
        </ul>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            to="/musteriler/yeni"
            className="text-sm font-medium text-[var(--accent)] underline-offset-2 hover:underline"
          >
            Müşteri oluştur (çift kontrolü ile)
          </Link>
          <Link
            to="/ayarlar/kurumsal-yapi"
            className="text-sm font-medium text-[var(--accent)] underline-offset-2 hover:underline"
          >
            Kurumsal yapı (şube / depo)
          </Link>
          <span className="inline-flex items-center gap-1 text-sm text-[var(--text-muted)]">
            <Search className="h-3.5 w-3.5" /> Global search API hazır — UI sonraki sprint
          </span>
        </div>
      </div>
    </div>
  )
}

function Metric({ icon: Icon, label, value }) {
  return (
    <div className="rounded-lg border border-[var(--border-subtle)] p-3">
      <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold tabular-nums text-[var(--text-primary)]">
        {value}
      </div>
    </div>
  )
}
