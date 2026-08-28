import { useEffect, useState } from 'react'
import { Percent, Trophy } from 'lucide-react'
import OptionListPanel from './OptionListPanel'
import ProcessSettingsSectionShell from './ProcessSettingsSectionShell'
import {
  DEFAULT_SALES_REP_SETTINGS,
  loadSalesRepSettings,
  saveSalesRepSettings,
  saveSalesRepTaskStages,
} from '../../utils/salesRepSettingsStore'

export default function SalesRepProcessSettingsPanel() {
  const [settings, setSettings] = useState(() => loadSalesRepSettings())

  useEffect(() => {
    function refresh() {
      setSettings(loadSalesRepSettings())
    }
    window.addEventListener('bach:sales-rep-settings-updated', refresh)
    return () => window.removeEventListener('bach:sales-rep-settings-updated', refresh)
  }, [])

  function updateNumber(field, value) {
    const next = saveSalesRepSettings({ [field]: Math.max(0, Number(value) || 0) })
    setSettings(next)
  }

  function updateStages(nextStages) {
    const next = saveSalesRepTaskStages(nextStages)
    setSettings(next)
  }

  return (
    <ProcessSettingsSectionShell
      title="Satış Temsilcileri Süreçleri"
      description="Puantaj oranları, puanlama ve temsilci görev süreç aşamaları."
      meta={`${settings.taskStages?.length || 0} görev aşaması tanımlı`}
    >
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-dark-900/35 p-4 shadow-inner">
          <div className="mb-3 flex items-center gap-2 text-emerald-300">
            <Percent className="h-4 w-4" />
            <p className="text-sm font-black">Prim Oranları</p>
          </div>
          <div className="space-y-3">
            <label className="block">
              <span className="form-label">Standart Satış Primi (%)</span>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                className="form-input text-sm"
                value={settings.baseCommissionRate}
                onChange={(e) => updateNumber('baseCommissionRate', e.target.value)}
              />
            </label>
            <label className="block">
              <span className="form-label">Ayın Birincisi Primi (%)</span>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                className="form-input text-sm"
                value={settings.winnerCommissionRate}
                onChange={(e) => updateNumber('winnerCommissionRate', e.target.value)}
              />
            </label>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-dark-900/35 p-4 shadow-inner">
          <div className="mb-3 flex items-center gap-2 text-amber-300">
            <Trophy className="h-4 w-4" />
            <p className="text-sm font-black">Yarış Puanları</p>
          </div>
          <div className="space-y-3">
            <label className="block">
              <span className="form-label">Satış Başına Puan</span>
              <input
                type="number"
                min="0"
                className="form-input text-sm"
                value={settings.pointsPerSale}
                onChange={(e) => updateNumber('pointsPerSale', e.target.value)}
              />
            </label>
            <label className="block">
              <span className="form-label">Teklif Başına Puan</span>
              <input
                type="number"
                min="0"
                className="form-input text-sm"
                value={settings.pointsPerQuote}
                onChange={(e) => updateNumber('pointsPerQuote', e.target.value)}
              />
            </label>
            <label className="block">
              <span className="form-label">Tamamlanan Görev Puanı</span>
              <input
                type="number"
                min="0"
                className="form-input text-sm"
                value={settings.pointsPerTask}
                onChange={(e) => updateNumber('pointsPerTask', e.target.value)}
              />
            </label>
          </div>
        </div>
      </div>

      <div className="mt-5">
        <OptionListPanel
          hideHeader
          title="Görev Süreç Aşamaları"
          description="Satış temsilcisi görevlerinde kullanılan süreç adımları."
          options={settings.taskStages}
          onChange={updateStages}
          placeholder="Yeni görev aşaması..."
          activeLabel="Aktif Aşama"
          countSuffix="aşama tanımlı"
          emptyMessage="Henüz görev aşaması eklenmedi."
        />
      </div>

      <p className="mt-4 text-[13px] text-gray-500">
        Varsayılan prim: %{DEFAULT_SALES_REP_SETTINGS.baseCommissionRate} · Ay birincisi: %
        {DEFAULT_SALES_REP_SETTINGS.winnerCommissionRate}
      </p>
    </ProcessSettingsSectionShell>
  )
}
