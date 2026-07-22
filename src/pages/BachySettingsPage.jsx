import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppPageHeader, AppPagePanel, AppPageShell } from '../components/Layout/AppPageLayout'
import { getBachySettings, saveBachySettings } from '../bachy/settingsStore'
import { BACHY_ASSET } from '../bachy/constants'

function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-xl border border-ds-border bg-[var(--ds-surface-muted)] px-3 py-2.5">
      <span className="text-ds-small font-semibold text-ds-ink">{label}</span>
      <input
        type="checkbox"
        className="h-4 w-4"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  )
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="block space-y-1">
      <span className="text-ds-caption font-semibold text-ds-muted">{label}</span>
      <select
        className="h-control w-full rounded-xl border border-ds-border bg-[var(--ds-surface-raised)] px-3 text-ds-small"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

export default function BachySettingsPage() {
  const [settings, setSettings] = useState(getBachySettings)

  useEffect(() => {
    setSettings(getBachySettings())
  }, [])

  function patch(partial) {
    setSettings(saveBachySettings(partial))
  }

  return (
    <AppPageShell>
      <AppPageHeader
        title="Bachy AIOS"
        actions={
          <Link to="/aios" className="btn-back px-3 text-xs">
            AIOS’a dön
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <AppPagePanel className="flex flex-col items-center justify-center p-4">
          <img
            src={BACHY_ASSET}
            alt="Bachy"
            className="max-h-56 w-auto object-contain drop-shadow-md"
          />
          <p className="mt-3 text-center text-ds-caption text-ds-muted">
            Referans karakter (değiştirilmez)
          </p>
        </AppPagePanel>

        <div className="space-y-4">
          <AppPagePanel className="space-y-3 p-4">
            <h2 className="ds-h3">Genel</h2>
            <Toggle
              label="Bachy aktif"
              checked={settings.enabled}
              onChange={(v) => patch({ enabled: v })}
            />
            <Toggle
              label="Hareket açık"
              checked={settings.motionEnabled}
              onChange={(v) => patch({ motionEnabled: v })}
            />
            <Toggle
              label="Fareyi takip et"
              checked={settings.followPointer}
              onChange={(v) => patch({ followPointer: v })}
            />
            <Toggle
              label="Hover’da gülümse"
              checked={settings.smileOnHover}
              onChange={(v) => patch({ smileOnHover: v })}
            />
            <label className="block space-y-1">
              <span className="text-ds-caption font-semibold text-ds-muted">
                Karakter boyutu ({settings.size.toFixed(2)})
              </span>
              <input
                type="range"
                min="0.6"
                max="1.4"
                step="0.05"
                value={settings.size}
                onChange={(e) => patch({ size: Number(e.target.value) })}
                className="w-full"
              />
            </label>
            <Select
              label="Konum"
              value={settings.position}
              onChange={(v) => patch({ position: v })}
              options={[
                { value: 'bottom-right', label: 'Sağ alt' },
                { value: 'bottom-left', label: 'Sol alt' },
                { value: 'bottom-center', label: 'Orta alt' },
              ]}
            />
          </AppPagePanel>

          <AppPagePanel className="space-y-3 p-4">
            <h2 className="ds-h3">Davranış & konuşma</h2>
            <Select
              label="Mod"
              value={settings.mode}
              onChange={(v) => patch({ mode: v })}
              options={[
                { value: 'fun', label: 'Eğlenceli' },
                { value: 'professional', label: 'Profesyonel' },
                { value: 'minimal', label: 'Minimal' },
              ]}
            />
            <Select
              label="Konuşma sıklığı"
              value={settings.speechFrequency}
              onChange={(v) => patch({ speechFrequency: v })}
              options={[
                { value: 'silent', label: 'Sessiz' },
                { value: 'rare', label: 'Seyrek' },
                { value: 'normal', label: 'Normal' },
                { value: 'frequent', label: 'Sık' },
              ]}
            />
            <Select
              label="Hareket yoğunluğu"
              value={settings.motionIntensity}
              onChange={(v) => patch({ motionIntensity: v })}
              options={[
                { value: 'off', label: 'Kapalı' },
                { value: 'minimal', label: 'Minimal' },
                { value: 'normal', label: 'Normal' },
                { value: 'lively', label: 'Canlı' },
              ]}
            />
            <Select
              label="AI tavsiye yoğunluğu"
              value={settings.adviceIntensity}
              onChange={(v) => patch({ adviceIntensity: v })}
              options={[
                { value: 'low', label: 'Düşük' },
                { value: 'balanced', label: 'Dengeli' },
                { value: 'high', label: 'Yüksek' },
              ]}
            />
            <Select
              label="Bildirim şekli"
              value={settings.notificationStyle}
              onChange={(v) => patch({ notificationStyle: v })}
              options={[
                { value: 'bubble', label: 'Balon' },
                { value: 'toast', label: 'Toast' },
                { value: 'both', label: 'İkisi' },
                { value: 'none', label: 'Kapalı' },
              ]}
            />
            <Toggle
              label="Sessiz mod"
              checked={settings.quietMode}
              onChange={(v) => patch({ quietMode: v })}
            />
            <Toggle
              label="Sesli mod (TTS)"
              checked={settings.voiceEnabled}
              onChange={(v) => patch({ voiceEnabled: v })}
            />
            <Toggle
              label="OpenAI Voice"
              checked={settings.openaiVoice}
              onChange={(v) => patch({ openaiVoice: v })}
            />
          </AppPagePanel>

          <AppPagePanel className="space-y-3 p-4">
            <h2 className="ds-h3">Kutlamalar & temalar</h2>
            <Toggle
              label="Kutlama animasyonları"
              checked={settings.celebrationAnimations}
              onChange={(v) => patch({ celebrationAnimations: v })}
            />
            <Toggle
              label="Özel gün kutlamaları"
              checked={settings.specialDayCelebrations}
              onChange={(v) => patch({ specialDayCelebrations: v })}
            />
            <Toggle
              label="Doğum günü kutlamaları"
              checked={settings.birthdayCelebrations}
              onChange={(v) => patch({ birthdayCelebrations: v })}
            />
            <Toggle
              label="Yılbaşı teması"
              checked={settings.themeNewYear}
              onChange={(v) => patch({ themeNewYear: v })}
            />
            <Toggle
              label="Ramazan Bayramı teması"
              checked={settings.themeRamadan}
              onChange={(v) => patch({ themeRamadan: v })}
            />
            <Toggle
              label="Kurban Bayramı teması"
              checked={settings.themeSacrifice}
              onChange={(v) => patch({ themeSacrifice: v })}
            />
            <Toggle
              label="Cumhuriyet Bayramı teması"
              checked={settings.themeRepublic}
              onChange={(v) => patch({ themeRepublic: v })}
            />
          </AppPagePanel>
        </div>
      </div>
    </AppPageShell>
  )
}
