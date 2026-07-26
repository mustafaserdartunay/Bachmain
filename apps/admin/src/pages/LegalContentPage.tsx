import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, Save, ShieldAlert } from 'lucide-react'
import { PageHeader } from '@/components/ui/MetricCard'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { DataTable } from '@/components/ui/DataTable'
import { Badge } from '@/components/ui/Badge'
import { ErrorState } from '@/components/ui/ErrorState'
import { api } from '@/lib/api'
import { formatDateTime } from '@/lib/utils'
import type { TableColumn } from '@/types'

const LAWYER_NOTICE =
  'Bu sözleşmeler yayına alınmadan önce KVKK, e-Ticaret ve Tüketici Hukuku alanında uzman bir avukat tarafından kontrol edilmelidir.'

type LegalDoc = {
  id: string
  type: string
  slug: string
  title: string
  status: string
  currentVersion: string
  versions?: { id: string; version: string; status: string; publishedAt?: string }[]
  current?: { bodyMarkdown?: string; version?: string; publishedAt?: string; revisionAt?: string }
}

type ConsentRow = {
  id: string
  accountId?: string
  customerId?: string
  email?: string
  type: string
  title?: string
  version: string
  ip?: string
  browser?: string
  os?: string
  device?: string
  language?: string
  acceptedAt?: string
  context?: string
}

export function LegalContentPage() {
  const [tab, setTab] = useState<'docs' | 'consents' | 'company'>('docs')
  const [docs, setDocs] = useState<LegalDoc[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [body, setBody] = useState('')
  const [title, setTitle] = useState('')
  const [consents, setConsents] = useState<ConsentRow[]>([])
  const [company, setCompany] = useState({
    legalName: '',
    location: '',
    contactEmail: '',
    supportEmail: '',
    kvkkEmail: '',
  })
  const [q, setQ] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  const loadDocs = useCallback(async () => {
    const data = await api.get<{ documents: LegalDoc[]; company: typeof company }>(
      '/legal/admin/documents',
    )
    setDocs(data.documents || [])
    if (data.company) setCompany((c) => ({ ...c, ...data.company }))
    const first = data.documents?.[0]
    if (first) {
      setSelectedId((prev) => prev || first.id)
    }
  }, [])

  const loadConsents = useCallback(async () => {
    const data = await api.get<{ consents: ConsentRow[] }>(
      `/legal/admin/consents?limit=300${q ? `&q=${encodeURIComponent(q)}` : ''}`,
    )
    setConsents(data.consents || [])
  }, [q])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setError('')
        await loadDocs()
        await loadConsents()
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Yüklenemedi')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [loadDocs, loadConsents])

  const selected = useMemo(() => docs.find((d) => d.id === selectedId) || null, [docs, selectedId])

  useEffect(() => {
    if (!selected) return
    setTitle(selected.title)
    setBody(selected.current?.bodyMarkdown || '')
  }, [selected])

  const saveDraft = async () => {
    if (!selected) return
    setBusy(true)
    setMsg('')
    try {
      await api.put(`/legal/admin/documents/${selected.id}`, {
        title,
        bodyMarkdown: body,
        publish: false,
      })
      setMsg('Taslak kaydedildi')
      await loadDocs()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kayıt başarısız')
    } finally {
      setBusy(false)
    }
  }

  const publish = async () => {
    if (!selected) return
    if (
      !window.confirm(
        'Yeni versiyon yayınlansın mı? Kullanıcılar tekrar onay vermek zorunda kalır.',
      )
    )
      return
    setBusy(true)
    setMsg('')
    try {
      await api.put(`/legal/admin/documents/${selected.id}`, {
        title,
        bodyMarkdown: body,
        publish: true,
      })
      setMsg('Yeni versiyon yayınlandı')
      await loadDocs()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Yayın başarısız')
    } finally {
      setBusy(false)
    }
  }

  const saveCompany = async () => {
    setBusy(true)
    try {
      await api.put('/legal/admin/company', company)
      setMsg('Firma bilgileri güncellendi')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kayıt başarısız')
    } finally {
      setBusy(false)
    }
  }

  const consentColumns: TableColumn<ConsentRow>[] = useMemo(
    () => [
      {
        key: 'acceptedAt',
        label: 'Tarih',
        render: (r) => (
          <span className="whitespace-nowrap text-xs tabular-nums">
            {formatDateTime(r.acceptedAt || '')}
          </span>
        ),
      },
      {
        key: 'email',
        label: 'Kullanıcı',
        render: (r) => (
          <div className="text-sm">
            <div className="font-medium">{r.email || r.accountId || '—'}</div>
            <div className="text-xs text-text-muted">{r.customerId || ''}</div>
          </div>
        ),
      },
      {
        key: 'title',
        label: 'Sözleşme',
        render: (r) => (
          <div>
            <div className="font-medium">{r.title || r.type}</div>
            <Badge variant="default">v{r.version}</Badge>
          </div>
        ),
      },
      { key: 'ip', label: 'IP', render: (r) => <span className="font-mono text-xs">{r.ip}</span> },
      {
        key: 'device',
        label: 'Cihaz',
        render: (r) => (
          <span className="text-xs">
            {r.browser} · {r.os} · {r.device}
          </span>
        ),
      },
      { key: 'context', label: 'Bağlam', render: (r) => r.context || '—' },
    ],
    [],
  )

  if (error && !docs.length) return <ErrorState onRetry={() => window.location.reload()} />

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <PageHeader title="Hukuki İçerikler" subtitle="Sözleşme CMS · versiyon · onay raporları" />

      <Card padding="md" hover={false} className="border-amber-500/25 bg-amber-500/5">
        <div className="flex gap-2">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
          <p className="text-sm font-medium text-amber-950">{LAWYER_NOTICE}</p>
        </div>
      </Card>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ['docs', 'Sözleşmeler'],
            ['consents', 'Onay Raporu'],
            ['company', 'Firma Bilgileri'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-xl px-4 py-2 text-sm font-bold ${
              tab === id ? 'bg-blue-600 text-white' : 'bg-border/40 text-text'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {msg ? <p className="text-sm font-semibold text-emerald-700">{msg}</p> : null}
      {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}

      {tab === 'docs' ? (
        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <Card padding="md" hover={false} className="space-y-2">
            {docs.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setSelectedId(d.id)}
                className={`flex w-full items-start gap-2 rounded-xl px-3 py-2 text-left text-sm ${
                  selectedId === d.id ? 'bg-blue-50 text-blue-800' : 'hover:bg-border/30'
                }`}
              >
                <FileText className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  <span className="block font-bold">{d.title}</span>
                  <span className="text-xs text-text-muted">v{d.currentVersion}</span>
                </span>
              </button>
            ))}
          </Card>
          <Card padding="md" hover={false} className="space-y-4">
            {selected ? (
              <>
                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                    Başlık
                  </span>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                </label>
                <div className="flex flex-wrap gap-3 text-xs text-text-muted">
                  <span>Slug: /{selected.slug}</span>
                  <span>Tür: {selected.type}</span>
                  <span>Güncel: v{selected.currentVersion}</span>
                </div>
                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                    Metin (Markdown)
                  </span>
                  <Textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={18}
                    className="font-mono text-xs"
                  />
                </label>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="secondary" disabled={busy} onClick={saveDraft}>
                    <Save className="h-4 w-4" />
                    Taslak kaydet
                  </Button>
                  <Button type="button" disabled={busy} onClick={publish}>
                    Yeni versiyon yayınla
                  </Button>
                </div>
                {selected.versions?.length ? (
                  <div>
                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-text-muted">
                      Versiyon geçmişi
                    </p>
                    <ul className="space-y-1 text-sm">
                      {selected.versions.map((v) => (
                        <li
                          key={v.id}
                          className="flex justify-between gap-2 rounded-lg bg-border/20 px-3 py-2"
                        >
                          <span>
                            v{v.version} · {v.status}
                          </span>
                          <span className="tabular-nums text-xs text-text-muted">
                            {v.publishedAt ? formatDateTime(v.publishedAt) : '—'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </>
            ) : (
              <p className="text-sm text-text-muted">Sözleşme seçin</p>
            )}
          </Card>
        </div>
      ) : null}

      {tab === 'consents' ? (
        <Card padding="md" hover={false} className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Input
              placeholder="E-posta, IP, hesap ara…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="max-w-sm"
            />
            <Button type="button" variant="secondary" onClick={() => loadConsents()}>
              Ara
            </Button>
          </div>
          <DataTable columns={consentColumns} rows={consents} />
        </Card>
      ) : null}

      {tab === 'company' ? (
        <Card padding="md" hover={false} className="max-w-xl space-y-4">
          {(
            [
              ['legalName', 'Firma ünvanı'],
              ['location', 'Konum'],
              ['contactEmail', 'İletişim e-posta'],
              ['supportEmail', 'Destek e-posta'],
              ['kvkkEmail', 'KVKK e-posta'],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                {label}
              </span>
              <Input
                value={company[key]}
                onChange={(e) => setCompany((c) => ({ ...c, [key]: e.target.value }))}
              />
            </label>
          ))}
          <Button type="button" disabled={busy} onClick={saveCompany}>
            Kaydet
          </Button>
        </Card>
      ) : null}
    </motion.div>
  )
}
