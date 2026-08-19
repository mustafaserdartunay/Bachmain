import { useEffect, useState } from 'react'
import {
  AppPageBackLink,
  AppPageHeader,
  AppPagePanel,
  AppPageShell,
} from '../../components/Layout/AppPageLayout'
import { BTN_PRIMARY, BTN_SUCCESS } from '../../utils/buttonStyles'
import { readCompanySettings } from '../../utils/companySettings'
import { NILVERA_TEST_SENDER } from '../../data/nilveraTestParties'
import { edocumentsApi } from '../../utils/edocumentsApi'
import {
  connectionStatusLabel,
  EdocAlert,
  EDocumentsSubnav,
  formatEdocError,
} from './eDocumentShared'

const SIGNATURE_OPTIONS = [
  { value: 'MALIMUHUR', label: 'Mali mühür (tüzel kişi)' },
  { value: 'EIMZA', label: 'e-İmza' },
  { value: 'MOBIL_IMZA', label: 'Mobil imza' },
]

export default function EDocumentSettingsPage() {
  const brand = readCompanySettings()
  const [connection, setConnection] = useState(null)
  const [platform, setPlatform] = useState(null)
  const [environment, setEnvironment] = useState('TEST')
  const [companyTitle, setCompanyTitle] = useState(brand.legalTitle || brand.companyName || '')
  const [taxNumber, setTaxNumber] = useState(brand.taxNumber || '')
  const [taxOffice, setTaxOffice] = useState(brand.taxOffice || '')
  const [address, setAddress] = useState(brand.address || '')
  const [city, setCity] = useState('')
  const [district, setDistrict] = useState('')
  const [phone, setPhone] = useState(brand.phone || '')
  const [email, setEmail] = useState(brand.email || '')
  const [signatureType, setSignatureType] = useState('')
  const [signatureDeclared, setSignatureDeclared] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  function applyConnection(conn) {
    if (!conn) return
    setConnection(conn)
    if (conn.environment) setEnvironment(conn.environment)
    if (conn.companyTitle) setCompanyTitle(conn.companyTitle)
    if (conn.taxNumber) setTaxNumber(conn.taxNumber)
    if (conn.taxOffice) setTaxOffice(conn.taxOffice)
    if (conn.address) setAddress(conn.address)
    if (conn.city) setCity(conn.city)
    if (conn.district) setDistrict(conn.district)
    if (conn.phone) setPhone(conn.phone)
    if (conn.email) setEmail(conn.email)
    if (conn.signatureType) setSignatureType(conn.signatureType)
    if (conn.signatureDeclared) setSignatureDeclared(true)
  }

  async function load() {
    setError('')
    try {
      const data = await edocumentsApi.connection()
      applyConnection(data.connection)
      setPlatform(data.platform || null)
    } catch (err) {
      setError(formatEdocError(err))
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function save() {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const data = await edocumentsApi.saveConnection({
        environment,
        companyTitle,
        taxNumber,
        taxOffice,
        address,
        city,
        district,
        phone,
        email,
        signatureType,
        signatureDeclared,
      })
      applyConnection(data.connection)
      setMessage('Firma bilgileri kaydedildi. Şimdi Nilvera kontrolünü çalıştırın.')
    } catch (err) {
      setError(formatEdocError(err))
    } finally {
      setBusy(false)
    }
  }

  async function check() {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await edocumentsApi.saveConnection({
        environment,
        companyTitle,
        taxNumber,
        taxOffice,
        address,
        city,
        district,
        phone,
        email,
        signatureType,
        signatureDeclared,
      })
      const data = await edocumentsApi.testConnection()
      applyConnection(data.connection)
      if (data.connection?.status === 'connected') {
        setMessage(`✓ Nilvera kontrolü geçti\n${data.connection.nextStep || ''}`)
      } else {
        setError(data.connection?.nextStep || data.connection?.lastError || 'Kontrol tamamlanmadı')
      }
    } catch (err) {
      setError(`✕ Nilvera kontrolü başarısız\n${formatEdocError(err)}`)
      if (err.payload?.connection) applyConnection(err.payload.connection)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AppPageShell>
      <AppPageHeader
        title={<AppPageBackLink to="/e-belgeler" label="E-Belgeler" />}
        centerTitle="E-Belge Ayarları"
        showBack={false}
      />
      <EDocumentsSubnav />
      <AppPagePanel
        title="Üye e-Fatura açılışı"
        description="Nilvera bağlantısı Bachmain yönetim sistemindedir. Siz firma bilgisi ve imza beyanı girersiniz; sistem Nilvera kontrolünden geçirir."
      >
        <EdocAlert>{error}</EdocAlert>
        <EdocAlert tone="emerald">{message}</EdocAlert>
        <div className="mb-6 grid gap-2 rounded-xl border border-dark-500/40 bg-dark-900/40 p-4 text-sm">
          <p className="font-black">{connectionStatusLabel(connection)}</p>
          <p>
            Bachmain Nilvera:{' '}
            {platform?.configured
              ? `hazır · ${platform.companyTitle || 'bağlı'}`
              : 'yönetim henüz bağlamadı'}
          </p>
          <p>Şirket: {connection?.companyTitle || '—'}</p>
          <p>VKN: {connection?.taxNumber || '—'}</p>
          <p>
            Son kontrol:{' '}
            {connection?.lastTestAt ? new Date(connection.lastTestAt).toLocaleString('tr-TR') : '—'}
          </p>
          {connection?.nextStep ? <p className="text-amber-200">{connection.nextStep}</p> : null}
        </div>
        <div className="grid max-w-xl gap-4">
          <label className="block space-y-1 text-sm">
            <span className="text-xs font-black uppercase text-gray-500">Ortam</span>
            <select
              className="w-full rounded-xl border border-dark-500/50 bg-dark-800 px-3 py-2"
              value={environment}
              onChange={(e) => setEnvironment(e.target.value)}
            >
              <option value="TEST">Test</option>
              <option value="PRODUCTION">Canlı</option>
            </select>
          </label>
          <label className="block space-y-1 text-sm">
            <span className="text-xs font-black uppercase text-gray-500">Resmi unvan</span>
            <input
              className="w-full rounded-xl border border-dark-500/50 bg-dark-800 px-3 py-2"
              value={companyTitle}
              onChange={(e) => setCompanyTitle(e.target.value)}
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="text-xs font-black uppercase text-gray-500">VKN / TCKN</span>
            <input
              className="w-full rounded-xl border border-dark-500/50 bg-dark-800 px-3 py-2"
              value={taxNumber}
              onChange={(e) => setTaxNumber(e.target.value)}
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="text-xs font-black uppercase text-gray-500">Vergi dairesi</span>
            <input
              className="w-full rounded-xl border border-dark-500/50 bg-dark-800 px-3 py-2"
              value={taxOffice}
              onChange={(e) => setTaxOffice(e.target.value)}
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="text-xs font-black uppercase text-gray-500">Adres</span>
            <input
              className="w-full rounded-xl border border-dark-500/50 bg-dark-800 px-3 py-2"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1 text-sm">
              <span className="text-xs font-black uppercase text-gray-500">İlçe</span>
              <input
                className="w-full rounded-xl border border-dark-500/50 bg-dark-800 px-3 py-2"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="text-xs font-black uppercase text-gray-500">İl</span>
              <input
                className="w-full rounded-xl border border-dark-500/50 bg-dark-800 px-3 py-2"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </label>
          </div>
          <label className="block space-y-1 text-sm">
            <span className="text-xs font-black uppercase text-gray-500">İmza türü</span>
            <select
              className="w-full rounded-xl border border-dark-500/50 bg-dark-800 px-3 py-2"
              value={signatureType}
              onChange={(e) => setSignatureType(e.target.value)}
            >
              <option value="">Seçin</option>
              {SIGNATURE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={signatureDeclared}
              onChange={(e) => setSignatureDeclared(e.target.checked)}
            />
            <span>
              Mali mühür / e-imza / mobil imzayı kendim aldım veya GİB başvurusunu başlattım.
              Bachmain bu imzayı satmaz.
            </span>
          </label>
          <p className="text-xs text-[var(--muted)]">
            Test ortamında Bachmain = Test Kurum 1 (VKN 1234567801). Test Kurum 2 alıcıdır; fatura
            keserken Yeni E-Fatura ekranından doldurulur. Canlıda kendi VKN’niz kullanılır.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={`${BTN_SUCCESS} px-4 text-xs`}
              disabled={busy}
              onClick={() => void save()}
            >
              Bilgileri kaydet
            </button>
            <button
              type="button"
              className={`${BTN_PRIMARY} px-4 text-xs`}
              disabled={busy}
              onClick={() => void check()}
            >
              Nilvera kontrolü
            </button>
            <button
              type="button"
              className="rounded-xl border border-dark-500/40 px-4 py-2 text-xs font-black uppercase tracking-wide text-gray-300"
              disabled={busy}
              onClick={() => {
                setEnvironment('TEST')
                setCompanyTitle(NILVERA_TEST_SENDER.name)
                setTaxNumber(NILVERA_TEST_SENDER.taxNumber)
                setSignatureType('MALIMUHUR')
                setSignatureDeclared(true)
              }}
            >
              Test Kurum 1’i doldur
            </button>
          </div>
          <p className="text-xs text-[var(--muted)]">
            API anahtarı üye ekranında yoktur. Önce yonetim.bachmain.com → E-Dönüşüm’de Bachmain
            Nilvera bağlantısı kurulur. Sizin VKN’niz o hesaptaki firma değilse yönetim, Nilvera
            portalında firmanızı açıp GİB aktivasyonundan sonra sistemi açar.
          </p>
        </div>
      </AppPagePanel>
    </AppPageShell>
  )
}
