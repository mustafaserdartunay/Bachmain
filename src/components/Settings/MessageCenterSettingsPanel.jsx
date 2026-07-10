import { useEffect, useMemo, useState } from 'react'
import { MessageCircle, Save, Wifi, WifiOff } from 'lucide-react'
import { readChannelConfig, saveChannelConfig } from '../../omnichannel/store'
import {
  getConnectedMessageCenterChannels,
  MESSAGE_CENTER_CHANNEL_DEFINITIONS,
} from '../../utils/messageCenterChannels'
import { SOCIAL_BRAND_BACKGROUNDS, SOCIAL_BRAND_ICONS } from '../Layout/SocialBrandIcons'
import FormSectionPanel, { FORM_FIELD_ROW_CLASS } from '../Common/FormSectionPanel'
import { APP_FILTER_LABEL_CLASS, APP_METRIC_ROW_CLASS, APP_SUBLABEL_CLASS } from '../../utils/dashboardDesign'
import { BTN_SUCCESS } from '../../utils/buttonStyles'

function ChannelConfigCard({ channel, config, onChange }) {
  const Icon = SOCIAL_BRAND_ICONS[channel.id]
  const connected = Boolean(config?.connected)

  function updateField(key, value) {
    onChange(channel.id, { ...config, [key]: value })
  }

  return (
    <section className={`${FORM_FIELD_ROW_CLASS} !grid !grid-cols-1 !gap-3 !p-4`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm ${SOCIAL_BRAND_BACKGROUNDS[channel.id] || 'bg-[rgba(140,145,165,0.2)]'}`}>
            {Icon ? <Icon className="h-4 w-4" /> : null}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-extrabold text-[var(--ink)]">{channel.label}</p>
            <p className="text-[12px] font-semibold text-[var(--muted)]">{channel.api}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {connected ? <Wifi className="h-4 w-4 text-emerald-600" /> : <WifiOff className="h-4 w-4 text-[var(--muted)]" />}
          <label className="flex items-center gap-2 text-xs font-bold text-[var(--ink)]">
            <input
              type="checkbox"
              checked={connected}
              onChange={(event) => updateField('connected', event.target.checked)}
            />
            Bağlı
          </label>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {channel.fields.map((field) => (
          <label key={field.key} className="block space-y-1">
            <span className={APP_FILTER_LABEL_CLASS}>{field.label}</span>
            <input
              type={field.type || 'text'}
              value={config?.[field.key] || ''}
              onChange={(event) => updateField(field.key, event.target.value)}
              placeholder={field.placeholder}
              className="form-input w-full text-xs"
              autoComplete={field.type === 'password' ? 'new-password' : 'off'}
            />
          </label>
        ))}
      </div>
    </section>
  )
}

export default function MessageCenterSettingsPanel() {
  const [channelConfig, setChannelConfig] = useState(() => readChannelConfig())
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    function refresh() {
      setChannelConfig(readChannelConfig())
    }
    window.addEventListener('bach:omni-updated', refresh)
    return () => window.removeEventListener('bach:omni-updated', refresh)
  }, [])

  const connectedChannels = useMemo(
    () => getConnectedMessageCenterChannels(channelConfig),
    [channelConfig],
  )

  function patchChannel(channelId, nextConfig) {
    setChannelConfig((current) => ({
      ...current,
      [channelId]: nextConfig,
    }))
  }

  function handleSave() {
    saveChannelConfig(channelConfig)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-4">
      <FormSectionPanel icon={MessageCircle} title="Bağlı Kanallar" dotColor="emerald">
        {connectedChannels.length === 0 ? (
          <p className="text-sm font-semibold text-[var(--muted)]">
            Henüz bağlı kanal yok. Aşağıdan kanal seçip API bilgilerini girip &quot;Bağlı&quot; işaretleyin.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {connectedChannels.map((channel) => {
              const Icon = SOCIAL_BRAND_ICONS[channel.id]
              return (
                <span
                  key={channel.id}
                  className={`${APP_METRIC_ROW_CLASS} !inline-flex !w-auto !min-h-0 items-center gap-2 !px-3 !py-2`}
                >
                  <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${SOCIAL_BRAND_BACKGROUNDS[channel.id]}`}>
                    {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
                  </span>
                  <span className="text-xs font-extrabold text-[var(--ink)]">{channel.label}</span>
                  <span className="text-[12px] font-bold text-emerald-600">Bağlı</span>
                </span>
              )
            })}
          </div>
        )}
        <p className={APP_SUBLABEL_CLASS}>
          {connectedChannels.length}/{MESSAGE_CENTER_CHANNEL_DEFINITIONS.length} kanal bağlı
        </p>
      </FormSectionPanel>

      <div className="grid gap-3 xl:grid-cols-2">
        {MESSAGE_CENTER_CHANNEL_DEFINITIONS.map((channel) => (
          <ChannelConfigCard
            key={channel.id}
            channel={channel}
            config={channelConfig[channel.id]}
            onChange={patchChannel}
          />
        ))}
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          className={`${BTN_SUCCESS} inline-flex items-center gap-2 px-4 py-2 text-xs`}
        >
          <Save className="h-3.5 w-3.5" />
          {saved ? 'Kaydedildi' : 'Kaydet'}
        </button>
      </div>
    </div>
  )
}
