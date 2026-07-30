import { downloadDocumentPdf } from '../documents/engine'
import { readCompanySettings } from './companySettings'

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function money(value) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0)
}

function signedMoney(value) {
  const amount = Number(value) || 0
  return `${amount >= 0 ? '+' : '−'}${money(Math.abs(amount))}`
}

function statusMeta(tone) {
  if (tone === 'green') return { label: 'Güçlü', color: '#059669', soft: '#d1fae5' }
  if (tone === 'orange') return { label: 'Sınırda', color: '#d97706', soft: '#fef3c7' }
  return { label: 'Açık', color: '#e11d48', soft: '#ffe4e6' }
}

function metric(label, value, color = '#0f172a') {
  return `
    <div class="metric">
      <div class="metric-label">${escapeHtml(label)}</div>
      <div class="metric-value" style="color:${color}">${escapeHtml(value)}</div>
    </div>
  `
}

function tableRow(label, value, note = '') {
  return `
    <tr>
      <td>
        <strong>${escapeHtml(label)}</strong>
        ${note ? `<small>${escapeHtml(note)}</small>` : ''}
      </td>
      <td>${escapeHtml(money(value))}</td>
    </tr>
  `
}

function capacityBar(status) {
  const marker = Math.min(98, Math.max(2, Number(status.marker) || 2))
  const meta = statusMeta(status.tone)
  return `
    <div class="capacity">
      <div class="capacity-head">
        <span>Karşılama oranı</span>
        <strong style="color:${meta.color}">%${Math.max(0, Math.round(status.coverage))}</strong>
      </div>
      <div class="capacity-track">
        <span class="capacity-marker" style="left:${marker}%;background:${meta.color}"></span>
      </div>
      <div class="capacity-scale"><span>Açık</span><span>Sınırda</span><span>Güçlü</span></div>
    </div>
  `
}

export function buildMonthEndCapacityReportHtml(snapshot) {
  const company = readCompanySettings()
  const currentMeta = statusMeta(snapshot.current.tone)
  const projectedMeta = statusMeta(snapshot.projected.tone)
  const generatedAt = new Date().toLocaleString('tr-TR', {
    dateStyle: 'long',
    timeStyle: 'short',
  })
  const logo = String(company.logoDataUrl || '').startsWith('data:image/')
    ? `<img class="logo" src="${escapeHtml(company.logoDataUrl)}" alt="Logo" />`
    : '<div class="logo-fallback">B</div>'

  return `
    <!doctype html>
    <html lang="tr">
      <head>
        <meta charset="utf-8" />
        <style>
          * { box-sizing: border-box; }
          body {
            margin: 0;
            padding: 36px;
            background: #f8fafc;
            color: #0f172a;
            font-family: Inter, Arial, sans-serif;
            font-size: 12px;
          }
          .page { width: 100%; }
          .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 24px;
            padding: 22px 24px;
            border-radius: 18px;
            color: #fff;
            background: linear-gradient(135deg, #172554, #1d4ed8 58%, #38bdf8);
          }
          .brand { display: flex; align-items: center; gap: 14px; }
          .logo, .logo-fallback {
            width: 54px;
            height: 54px;
            border-radius: 14px;
            object-fit: contain;
            background: #fff;
          }
          .logo-fallback {
            display: flex;
            align-items: center;
            justify-content: center;
            color: #1d4ed8;
            font-size: 28px;
            font-weight: 900;
          }
          .company { font-size: 18px; font-weight: 900; }
          .company-sub { margin-top: 4px; color: #bfdbfe; font-size: 10px; }
          .report-title { text-align: right; }
          .report-title h1 { margin: 0; font-size: 20px; }
          .report-title p { margin: 5px 0 0; color: #dbeafe; }
          .section {
            margin-top: 18px;
            padding: 18px;
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            background: #fff;
          }
          .section-title {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 14px;
          }
          .section-title h2 { margin: 0; font-size: 15px; }
          .badge {
            border-radius: 999px;
            padding: 5px 10px;
            font-size: 10px;
            font-weight: 800;
          }
          .metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
          .metric {
            min-height: 66px;
            padding: 12px;
            border-radius: 12px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
          }
          .metric-label {
            color: #64748b;
            font-size: 9px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: .04em;
          }
          .metric-value { margin-top: 7px; font-size: 15px; font-weight: 900; }
          .columns { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 14px; }
          .table-card { overflow: hidden; border: 1px solid #e2e8f0; border-radius: 12px; }
          .table-title {
            padding: 10px 12px;
            background: #f1f5f9;
            color: #334155;
            font-size: 10px;
            font-weight: 900;
            text-transform: uppercase;
          }
          table { width: 100%; border-collapse: collapse; }
          td { padding: 9px 12px; border-top: 1px solid #e2e8f0; }
          td:last-child { text-align: right; font-weight: 800; }
          td small { display: block; margin-top: 2px; color: #94a3b8; font-size: 8px; }
          tr.total td { color: #1d4ed8; background: #eff6ff; font-weight: 900; }
          .capacity { margin-top: 14px; }
          .capacity-head { display: flex; justify-content: space-between; font-size: 10px; font-weight: 700; }
          .capacity-track {
            position: relative;
            height: 11px;
            margin-top: 7px;
            border-radius: 999px;
            background: linear-gradient(90deg, #e11d48, #f59e0b 50%, #10b981);
          }
          .capacity-marker {
            position: absolute;
            top: 50%;
            width: 18px;
            height: 18px;
            border: 3px solid #fff;
            border-radius: 999px;
            box-shadow: 0 2px 7px rgba(15, 23, 42, .25);
            transform: translate(-50%, -50%);
          }
          .capacity-scale { display: flex; justify-content: space-between; margin-top: 5px; color: #94a3b8; font-size: 8px; font-weight: 700; }
          .guidance {
            margin-top: 18px;
            padding: 14px 16px;
            border-left: 4px solid #3b82f6;
            border-radius: 10px;
            background: #eff6ff;
            color: #1e3a8a;
            font-weight: 700;
            line-height: 1.45;
          }
          .notes {
            margin-top: 18px;
            padding: 14px 16px;
            border-radius: 12px;
            background: #f1f5f9;
            color: #475569;
            font-size: 9px;
            line-height: 1.55;
          }
          .notes strong { color: #0f172a; }
          .footer {
            display: flex;
            justify-content: space-between;
            margin-top: 14px;
            color: #94a3b8;
            font-size: 8px;
          }
        </style>
      </head>
      <body>
        <main class="page">
          <header class="header">
            <div class="brand">
              ${logo}
              <div>
                <div class="company">${escapeHtml(company.companyName || company.legalTitle || 'BachMain')}</div>
                <div class="company-sub">${escapeHtml(company.legalTitle || 'Kurumsal Yönetim Platformu')}</div>
              </div>
            </div>
            <div class="report-title">
              <h1>Ay Sonu Nakit Dengesi</h1>
              <p>${escapeHtml(snapshot.monthLabel)} · ${escapeHtml(generatedAt)}</p>
            </div>
          </header>

          <section class="section">
            <div class="section-title">
              <h2>1. Mevcut Alacak–Borç Dengesi</h2>
              <span class="badge" style="color:${currentMeta.color};background:${currentMeta.soft}">${currentMeta.label}</span>
            </div>
            <div class="metrics">
              ${metric('Toplam kaynak', money(snapshot.current.resources), '#2563eb')}
              ${metric('Toplam ödeme', money(snapshot.current.obligations), '#e11d48')}
              ${metric('Net denge', signedMoney(snapshot.current.balance), currentMeta.color)}
              ${metric('Karşılama', `%${Math.max(0, Math.round(snapshot.current.coverage))}`, currentMeta.color)}
            </div>
            <div class="columns">
              <div class="table-card">
                <div class="table-title">Kaynaklar</div>
                <table>
                  ${tableRow('Canlı varlık', snapshot.current.liveAssets, 'Kasa, banka, çek ve senet')}
                  ${tableRow('Müşteri alacağı', snapshot.current.receivables, 'Cari hesap alacak toplamı')}
                  <tr class="total"><td>Toplam kaynak</td><td>${escapeHtml(money(snapshot.current.resources))}</td></tr>
                </table>
              </div>
              <div class="table-card">
                <div class="table-title">Zorunlu ödemeler</div>
                <table>
                  ${tableRow('Tedarikçi borcu', snapshot.current.supplierPayables)}
                  ${tableRow('Kalan maaş yükü', snapshot.current.payroll)}
                  ${tableRow('Sabit genel gider', snapshot.current.fixedExpenses)}
                  <tr class="total"><td>Toplam ödeme</td><td>${escapeHtml(money(snapshot.current.obligations))}</td></tr>
                </table>
              </div>
            </div>
            ${capacityBar(snapshot.current)}
          </section>

          <section class="section">
            <div class="section-title">
              <h2>2. Operasyonel Nakit Dönüşüm Senaryosu</h2>
              <span class="badge" style="color:${projectedMeta.color};background:${projectedMeta.soft}">${projectedMeta.label}</span>
            </div>
            <div class="metrics">
              ${metric('Brüt potansiyel', money(snapshot.operational.total), '#2563eb')}
              ${metric('Senaryo kaynağı', money(snapshot.projected.resources), '#7c3aed')}
              ${metric('Senaryo neti', signedMoney(snapshot.projected.balance), projectedMeta.color)}
              ${metric('Karşılama', `%${Math.max(0, Math.round(snapshot.projected.coverage))}`, projectedMeta.color)}
            </div>
            <div class="table-card" style="margin-top:14px">
              <div class="table-title">Sipariş → Üretim → Depo</div>
              <table>
                ${tableRow('Siparişteki değer', snapshot.operational.orders, `${snapshot.operational.counts.orders} kayıt`)}
                ${tableRow('Üretimdeki değer', snapshot.operational.production, `${snapshot.operational.counts.production} kayıt`)}
                ${tableRow('Depodaki satılabilir değer', snapshot.operational.depot, `${snapshot.operational.counts.depot} kayıt`)}
                <tr class="total"><td>Toplam brüt nakit potansiyeli</td><td>${escapeHtml(money(snapshot.operational.total))}</td></tr>
              </table>
            </div>
            ${capacityBar(snapshot.projected)}
          </section>

          <div class="guidance"><strong>Öneri:</strong> ${escapeHtml(snapshot.guidance)}</div>

          <div class="notes">
            <strong>Hesaplama notları:</strong><br />
            Mevcut kapasite; canlı finansal varlıklar ve müşteri alacaklarının, tedarikçi borcu,
            ödenmemiş maaşlar ve kayıtlı sabit giderlerle karşılaştırılmasıdır. Operasyonel senaryoda
            sipariş, üretim ve depo kayıtları ortak belge kimlikleriyle tek kez sayılır; faturalandırılmış
            değerler tekrar eklenmez. Operasyonel değer tahmini brüt nakit potansiyelidir; gerçekleşmiş
            tahsilat, garanti edilmiş gelir veya muhasebesel kâr değildir.
          </div>

          <footer class="footer">
            <span>BachMain Document Platform</span>
            <span>Rapor dönemi: ${escapeHtml(snapshot.monthKey)}</span>
          </footer>
        </main>
      </body>
    </html>
  `
}

export async function downloadMonthEndCapacityReport(snapshot) {
  const html = buildMonthEndCapacityReportHtml(snapshot)
  await downloadDocumentPdf({
    docType: 'ay-sonu-nakit-raporu',
    documentId: snapshot.monthKey,
    filename: `ay-sonu-nakit-raporu-${snapshot.monthKey}.pdf`,
    html,
  })
}
