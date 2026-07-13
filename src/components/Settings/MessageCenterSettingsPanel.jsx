import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Copy, MessageCircle, PlugZap, Save, Wifi, WifiOff } from 'lucide-react'
import { readChannelConfig, saveChannelConfig } from '../../omnichannel/store'
import {
  getConnectedMessageCenterChannels,
  MESSAGE_CENTER_CHANNEL_DEFINITIONS,
} from '../../utils/messageCenterChannels'
import {
  loadWhatsAppServerConfig,
  saveWhatsAppServerConfig,
  testWhatsAppServerConnection,
  WHATSAPP_WEBHOOK_URL,
} from '../../utils/whatsappChannelApi'
import { flushWorkspaceNow } from '../../utils/workspaceStorage'
import { SOCIAL_BRAND_BACKGROUNDS, SOCIAL_BRAND_ICONS } from '../Layout/SocialBrandIcons'
import FormSectionPanel, { FORM_FIELD_ROW_CLASS } from '../Common/FormSectionPanel'
import { APP_FILTER_LABEL_CLASS, APP_METRIC_ROW_CLASS, APP_SUBLABEL_CLASS } from '../../utils/dashboardDesign'
import { BTN_SUCCESS } from '../../utils/buttonStyles'

function ChannelConfigCard({ channel, config, onChange, footer = null }) {
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
      {footer}
    </section>
  )
}

export default function MessageCenterSettingsPanel() {
  const [channelConfig, setChannelConfig] = useState(() => readChannelConfig())
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')
  const [webhookUrl, setWebhookUrl] = useState(WHATSAPP_WEBHOOK_URL)
  const [serverMeta, setServerMeta] = useState(null)

  useEffect(() => {
    function refresh() {
      setChannelConfig(readChannelConfig())
    }
    window.addEventListener('bach:omni-updated', refresh)
    return () => window.removeEventListener('bach:omni-updated', refresh)
  }, [])

  useEffect(() => {
    let cancelled = false
    loadWhatsAppServerConfig()
      .then((data) => {
        if (cancelled) return
        if (data.webhookUrl) setWebhookUrl(data.webhookUrl)
        if (data.config) {
          setServerMeta(data.config)
          setChannelConfig((current) => {
            const local = current.whatsapp || {}
            const nextWhatsapp = {
              ...local,
              connected: data.config.connected ?? local.connected,
              phoneNumberId: data.config.phoneNumberId || local.phoneNumberId || '',
              webhookVerifyToken: data.config.webhookVerifyToken || local.webhookVerifyToken || 'bach-wa-5301285610',
              displayPhone: data.config.displayPhone || local.displayPhone || '+905301285610',
              // Keep local token input; if empty and server has token, leave blank (masked on server)
              accessToken: local.accessToken || '',
            }
            return { ...current, whatsapp: nextWhatsapp }
          })
        }
      })
      .catch(() => {
        // offline / no session — local-only still works for drafts
      })
    return () => { cancelled = true }
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

  async function handleSave() {
    setBusy(true)
    setStatus('')
    try {
      saveChannelConfig(channelConfig)
      const wa = channelConfig.whatsapp || {}
      if (wa.phoneNumberId || wa.accessToken || wa.webhookVerifyToken) {
        const result = await saveWhatsAppServerConfig({
          connected: Boolean(wa.connected),
          phoneNumberId: wa.phoneNumberId,
          accessToken: wa.accessToken,
          webhookVerifyToken: wa.webhookVerifyToken || 'bach-wa-5301285610',
          displayPhone: wa.displayPhone || '+905301285610',
        })
        setServerMeta(result.config)
        if (result.webhookUrl) setWebhookUrl(result.webhookUrl)
        // Clear plaintext token from local draft after successful server save (optional keep for UX)
        if (wa.accessToken) {
          const next = {
            ...channelConfig,
            whatsapp: { ...wa, accessToken: '', connected: result.config.connected },
          }
          setChannelConfig(next)
          saveChannelConfig(next)
        }
      }
      await flushWorkspaceNow()
      setSaved(true)
      setStatus('WhatsApp ayarları bu üyelik (şirket) hesabına kaydedildi.')
      window.setTimeout(() => setSaved(false), 2000)
    } catch (error) {
      setStatus(error.message || 'Kayıt başarısız')
      window.alert(error.message || 'Kayıt başarısız')
    } finally {
      setBusy(false)
    }
  }

  async function handleTestWhatsApp() {
    setBusy(true)
    setStatus('')
    try {
      const wa = channelConfig.whatsapp || {}
      const result = await testWhatsAppServerConnection({
        phoneNumberId: wa.phoneNumberId,
        accessToken: wa.accessToken || undefined,
      })
      setServerMeta(result.config)
      const next = {
        ...channelConfig,
        whatsapp: {
          ...wa,
          connected: true,
          phoneNumberId: result.config.phoneNumberId || wa.phoneNumberId,
          accessToken: '',
        },
      }
      setChannelConfig(next)
      saveChannelConfig(next)
      await flushWorkspaceNow()
      setStatus(
        `Bağlantı OK — ${result.meta?.verifiedName || 'WhatsApp'} · ${result.meta?.displayPhone || result.config.displayPhone || ''}`.trim(),
      )
    } catch (error) {
      setStatus(error.message || 'Test başarısız')
      window.alert(error.message || 'WhatsApp bağlantı testi başarısız')
    } finally {
      setBusy(false)
    }
  }

  function copyWebhook() {
    navigator.clipboard?.writeText(webhookUrl).then(() => {
      setStatus('Webhook URL kopyalandı')
    }).catch(() => {
      window.prompt('Webhook URL', webhookUrl)
    })
  }

  const whatsappDef = MESSAGE_CENTER_CHANNEL_DEFINITIONS.find((item) => item.id === 'whatsapp')
  const otherDefs = MESSAGE_CENTER_CHANNEL_DEFINITIONS.filter((item) => item.id !== 'whatsapp')

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
          {connectedChannels.length}/{MESSAGE_CENTER_CHANNEL_DEFINITIONS.length} kanal bağlı · API ayarları şirket üyeliğinize özeldir
        </p>
      </FormSectionPanel>

      {whatsappDef ? (
        <ChannelConfigCard
          channel={whatsappDef}
          config={channelConfig.whatsapp}
          onChange={patchChannel}
          footer={(
            <div className="space-y-3 border-t border-[rgba(140,145,165,0.18)] pt-3">
              <div className="rounded-xl bg-[rgba(140,145,165,0.08)] px-3 py-2 text-[12px] font-semibold text-[var(--muted)]">
                <p className="mb-1 font-extrabold text-[var(--ink)]">Kurulum</p>
                <ol className="list-decimal space-y-1 pl-4">
                  <li>Meta → WhatsApp → API Setup sayfasından <strong>Phone number ID</strong> değerini kopyalayıp forma yapıştırın.</li>
                  <li><strong>Temporary access token</strong> (EAA…) değerini Access Token alanına yapıştırın.</li>
                  <li>Webhook URL’yi Meta’da Callback URL yapın; Verify Token: <code className="font-mono">bach-wa-5301285610</code></li>
                  <li>Webhook alanı: <code className="font-mono">messages</code> abone edin.</li>
                  <li>Kaydet → Bağlantıyı Test Et.</li>
                </ol>
              </div>
              <label className="block space-y-1">
                <span className={APP_FILTER_LABEL_CLASS}>Webhook Callback URL</span>
                <div className="flex gap-2">
                  <input readOnly className="form-input w-full font-mono text-[11px]" value={webhookUrl} />
                  <button type="button" onClick={copyWebhook} className="btn-ghost inline-flex items-center gap-1 !px-3 !py-2 text-[11px] font-bold">
                    <Copy className="h-3.5 w-3.5" /> Kopyala
                  </button>
                </div>
              </label>
              {serverMeta?.hasAccessToken ? (
                <p className="flex items-center gap-2 text-[12px] font-bold text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Sunucuda kayıtlı token: {serverMeta.accessTokenMasked}
                  {serverMeta.displayPhone ? ` · ${serverMeta.displayPhone}` : ''}
                </p>
              ) : null}
              <div className="flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleTestWhatsApp}
                  className="btn-ghost inline-flex items-center gap-2 !px-4 !py-2 text-xs font-bold disabled:opacity-40"
                >
                  <PlugZap className="h-3.5 w-3.5" /> Bağlantıyı Test Et
                </button>
              </div>
            </div>
          )}
        />
      ) : null}

      <div className="grid gap-3 xl:grid-cols-2">
        {otherDefs.map((channel) => (
          <ChannelConfigCard
            key={channel.id}
            channel={channel}
            config={channelConfig[channel.id]}
            onChange={patchChannel}
          />
        ))}
      </div>

      {status ? (
        <p className="text-sm font-semibold text-[var(--ink)]">{status}</p>
      ) : null}

      <div className="flex justify-end">
        <button
          type="button"
          disabled={busy}
          onClick={handleSave}
          className={`${BTN_SUCCESS} inline-flex items-center gap-2 px-4 py-2 text-xs disabled:opacity-40`}
        >
          <Save className="h-3.5 w-3.5" />
          {saved ? 'Kaydedildi' : 'Kaydet'}
        </button>
      </div>
    </div>
  )
}
