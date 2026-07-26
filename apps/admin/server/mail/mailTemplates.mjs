import { MAIL_BRAND } from './mailConfig.mjs'

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function layout({ title, preview, bodyHtml, cta }) {
  const b = MAIL_BRAND
  const ctaHtml = cta?.href
    ? `<p style="margin:28px 0 8px;text-align:center">
        <a href="${escapeHtml(cta.href)}" style="display:inline-block;background:${b.accent};color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 22px;border-radius:12px">${escapeHtml(cta.label || 'Devam et')}</a>
      </p>`
    : ''
  return {
    subject: title,
    text: [title, preview, cta?.href].filter(Boolean).join('\n\n'),
    html: `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:${b.bg};font-family:Inter,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:${b.ink}">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(preview || '')}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${b.bg};padding:32px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:580px;background:${b.card};border-radius:20px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 20px 50px -28px rgba(11,31,58,.35)">
        <tr>
          <td style="background:${b.primary};padding:22px 28px;text-align:center">
            <img src="${b.logoUrl}" alt="BACHMAIN" height="36" style="display:inline-block;max-height:36px;width:auto" onerror="this.style.display='none'"/>
            <div style="margin-top:10px;font-size:13px;font-weight:800;letter-spacing:.18em;color:#93c5fd">BACHMAIN</div>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 28px 8px">
            <h1 style="margin:0 0 12px;font-size:22px;line-height:1.25;color:${b.primary}">${escapeHtml(title)}</h1>
            <div style="font-size:14px;line-height:1.65;color:${b.ink}">${bodyHtml}</div>
            ${ctaHtml}
          </td>
        </tr>
        <tr>
          <td style="padding:8px 28px 24px;font-size:12px;line-height:1.5;color:${b.muted}">
            Bu e-posta BACHMAIN hesabınızla ilişkilidir.
            Yardım: <a href="mailto:${escapeHtml(b.supportEmail())}" style="color:${b.accent}">${escapeHtml(b.supportEmail())}</a>
            · <a href="${escapeHtml(b.webUrl())}" style="color:${b.accent}">bachmain.com</a>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  }
}

function p(text) {
  return `<p style="margin:0 0 12px">${escapeHtml(text)}</p>`
}

function strongLine(label, value) {
  return `<p style="margin:0 0 8px"><span style="color:${MAIL_BRAND.muted}">${escapeHtml(label)}:</span> <strong>${escapeHtml(value)}</strong></p>`
}

/** @type {Record<string, (data: Record<string, any>) => {subject:string,html:string,text:string}>} */
export const MAIL_TEMPLATES = {
  welcome(data) {
    return layout({
      title: 'BACHMAIN’e hoş geldiniz',
      preview: 'Hesabınız hazır. ERP yolculuğunuza başlayın.',
      bodyHtml: `${p(`Merhaba ${data.name || 'değerli kullanıcımız'},`)}${p('BACHMAIN CRM & ERP hesabınız oluşturuldu. Tek platformda satış, stok, finans ve süreçlerinizi yönetebilirsiniz.')}${strongLine('Firma', data.company || '—')}${strongLine('Plan', data.plan || 'Starter')}`,
      cta: { href: data.appUrl || MAIL_BRAND.appUrl(), label: 'Uygulamaya git' },
    })
  },
  email_verification(data) {
    return layout({
      title: 'E-posta adresinizi doğrulayın',
      preview: 'Hesabınızı etkinleştirmek için doğrulama bağlantısı.',
      bodyHtml: `${p(`Merhaba ${data.name || ''},`)}${p('Güvenliğiniz için e-posta adresinizi doğrulayın. Bağlantı sınırlı süre geçerlidir.')}`,
      cta: { href: data.verifyUrl, label: 'E-postamı doğrula' },
    })
  },
  password_reset(data) {
    return layout({
      title: 'Şifre sıfırlama',
      preview: 'Şifrenizi yenilemek için güvenli bağlantı (30 dakika geçerli).',
      bodyHtml: `${p(`Merhaba ${data.name || ''},`)}${p('Şifre sıfırlama talebi aldık. Bağlantı 30 dakika geçerlidir ve tek kullanımlıktır. Siz değilseniz bu e-postayı yok sayın.')}`,
      cta: { href: data.resetUrl, label: 'Şifremi Sıfırla' },
    })
  },
  password_changed(data) {
    const support = data.supportEmail || MAIL_BRAND.supportEmail()
    return layout({
      title: 'Şifreniz başarıyla değiştirildi',
      preview: 'Hesap şifreniz güncellendi.',
      bodyHtml: `${p(`Merhaba ${data.name || ''},`)}${p('BACHMAIN hesap şifreniz başarıyla değiştirildi. Tüm aktif oturumlarınız güvenlik için sonlandırıldı; yeniden giriş yapmanız gerekir.')}${p(`Bu işlemi siz yapmadıysanız hemen destek ile iletişime geçin: ${support}`)}`,
      cta: { href: data.appUrl || `${MAIL_BRAND.webUrl()}/giris`, label: 'Giriş Yap' },
    })
  },
  new_login(data) {
    return layout({
      title: 'Yeni giriş bildirimi',
      preview: 'Hesabınıza yeni bir oturum açıldı.',
      bodyHtml: `${p(`Merhaba ${data.name || ''},`)}${p('Hesabınıza yeni bir giriş yapıldı.')}${strongLine('Zaman', data.at || new Date().toLocaleString('tr-TR'))}${strongLine('Cihaz / Tarayıcı', data.userAgent || '—')}${strongLine('IP', data.ip || '—')}${p('Siz değilseniz şifrenizi hemen değiştirin.')}`,
      cta: { href: `${MAIL_BRAND.appUrl()}/profil`, label: 'Güvenlik ayarları' },
    })
  },
  two_factor(data) {
    return layout({
      title: 'İki adımlı doğrulama kodu',
      preview: `Doğrulama kodunuz: ${data.code || ''}`,
      bodyHtml: `${p(`Merhaba ${data.name || ''},`)}${p('Giriş için tek kullanımlık doğrulama kodunuz:')}<p style="margin:18px 0;font-size:32px;letter-spacing:.3em;font-weight:800;text-align:center;color:${MAIL_BRAND.primary}">${escapeHtml(data.code || '')}</p>${p('Kod birkaç dakika içinde geçersiz olur.')}`,
    })
  },
  subscription_purchased(data) {
    return layout({
      title: 'Abonelik satın alındı',
      preview: `${data.planName || 'Paket'} aktif edildi.`,
      bodyHtml: `${p(`Merhaba ${data.name || ''},`)}${p('Aboneliğiniz başarıyla satın alındı.')}${strongLine('Paket', data.planName || '—')}${strongLine('Dönem', data.period || '—')}${strongLine('Tutar', data.amount || '—')}`,
      cta: { href: `${MAIL_BRAND.appUrl()}/profil/paketim`, label: 'Paketimi gör' },
    })
  },
  subscription_renewed(data) {
    return layout({
      title: 'Abonelik yenilendi',
      preview: 'Paket süreniz uzatıldı.',
      bodyHtml: `${p(`Merhaba ${data.name || ''},`)}${p('Aboneliğiniz yenilendi.')}${strongLine('Paket', data.planName || '—')}${strongLine('Yeni bitiş', data.periodEnd || '—')}`,
      cta: { href: `${MAIL_BRAND.appUrl()}/profil/paketim`, label: 'Paketimi gör' },
    })
  },
  package_expiring(data) {
    return layout({
      title: 'Paket bitiyor',
      preview: `Kalan süre: ${data.daysLeft ?? '—'} gün`,
      bodyHtml: `${p(`Merhaba ${data.name || ''},`)}${p('Aboneliğiniz yakında sona erecek. Kesintisiz kullanım için yenileyin.')}${strongLine('Bitiş', data.endDate || '—')}${strongLine('Kalan', `${data.daysLeft ?? '—'} gün`)}`,
      cta: { href: `${MAIL_BRAND.appUrl()}/paketler`, label: 'Yenile / yükselt' },
    })
  },
  package_expired(data) {
    return layout({
      title: 'Paket süresi doldu',
      preview: 'Aboneliğiniz sona erdi.',
      bodyHtml: `${p(`Merhaba ${data.name || ''},`)}${p('Abonelik süreniz doldu. Verileriniz korunur; işlemler için paketinizi yenileyin.')}`,
      cta: { href: `${MAIL_BRAND.appUrl()}/paketler`, label: 'Paketi yenile' },
    })
  },
  grace_started(data) {
    return layout({
      title: 'Ek kullanım süresi başladı',
      preview: 'Grace period aktif.',
      bodyHtml: `${p(`Merhaba ${data.name || ''},`)}${p('Aboneliğiniz sona erdi. Kısa bir ek kullanım süreniz başladı. Bu süre dolmadan yenilemenizi öneririz.')}${strongLine('Ek süre bitiş', data.graceUntil || '—')}`,
      cta: { href: `${MAIL_BRAND.appUrl()}/paketler`, label: 'Şimdi yenile' },
    })
  },
  payment_success(data) {
    return layout({
      title: 'Ödeme başarılı',
      preview: 'Ödemeniz alındı.',
      bodyHtml: `${p(`Merhaba ${data.name || ''},`)}${p('Ödemeniz başarıyla gerçekleşti.')}${strongLine('Tutar', data.amount || '—')}${strongLine('Referans', data.reference || '—')}`,
      cta: { href: `${MAIL_BRAND.appUrl()}/profil/paketim`, label: 'Ödeme detayı' },
    })
  },
  payment_approved(data) {
    return layout({
      title: 'Ödemeniz onaylandı',
      preview: 'Giriş yapabilirsiniz.',
      bodyHtml: `${p(`Merhaba ${data.name || ''},`)}${p('Ödemeniz kontrol edilip onaylandı. Artık BachMain hesabınıza giriş yapabilirsiniz.')}${strongLine('Paket', data.planName || '—')}${strongLine('Tutar', data.amount || '—')}${strongLine('Yöntem', data.method || '—')}${strongLine('Referans', data.reference || '—')}`,
      cta: { href: data.loginUrl || 'https://uygulama.bachmain.com/giris', label: 'Giriş yap' },
    })
  },
  payment_failed(data) {
    return layout({
      title: 'Ödeme başarısız',
      preview: 'Ödeme tamamlanamadı.',
      bodyHtml: `${p(`Merhaba ${data.name || ''},`)}${p('Ödeme işlemi tamamlanamadı. Kart veya banka bilgilerinizi kontrol edip tekrar deneyin.')}${strongLine('Sebep', data.reason || '—')}`,
      cta: { href: `${MAIL_BRAND.appUrl()}/profil/odeme`, label: 'Tekrar dene' },
    })
  },
  ticket_new(data) {
    return layout({
      title: 'Yeni destek talebi',
      preview: data.subject || 'Ticket oluşturuldu',
      bodyHtml: `${p(`Merhaba ${data.name || ''},`)}${p('Destek talebiniz alındı. Ekibimiz en kısa sürede dönüş yapacak.')}${strongLine('Konu', data.subject || '—')}${strongLine('Ticket', data.ticketId || '—')}`,
      cta: { href: data.ticketUrl || `${MAIL_BRAND.appUrl()}/destek`, label: 'Talebi gör' },
    })
  },
  ticket_replied(data) {
    return layout({
      title: 'Ticket yanıtlandı',
      preview: data.subject || 'Yeni yanıt var',
      bodyHtml: `${p(`Merhaba ${data.name || ''},`)}${p('Destek talebinize yeni bir yanıt geldi.')}${strongLine('Konu', data.subject || '—')}<p style="margin:12px 0;padding:12px;border-radius:12px;background:#f8fafc;border:1px solid #e2e8f0">${escapeHtml(data.replyPreview || '')}</p>`,
      cta: { href: data.ticketUrl || `${MAIL_BRAND.appUrl()}/destek`, label: 'Yanıtı oku' },
    })
  },
  new_message(data) {
    return layout({
      title: 'Yeni mesaj',
      preview: data.preview || 'Mesaj merkezinde yeni bir ileti var',
      bodyHtml: `${p(`Merhaba ${data.name || ''},`)}${p('Mesaj merkezinizde yeni bir mesaj var.')}<p style="margin:12px 0;padding:12px;border-radius:12px;background:#f8fafc">${escapeHtml(data.preview || '')}</p>`,
      cta: { href: data.messageUrl || `${MAIL_BRAND.appUrl()}/mesajlar`, label: 'Mesajları aç' },
    })
  },
  campaign(data) {
    return layout({
      title: data.title || 'Kampanya',
      preview: data.preview || 'BACHMAIN kampanya duyurusu',
      bodyHtml: `${p(`Merhaba ${data.name || ''},`)}<div style="margin:12px 0">${data.htmlBody || p(data.body || '')}</div>`,
      cta: data.ctaUrl ? { href: data.ctaUrl, label: data.ctaLabel || 'İncele' } : undefined,
    })
  },
  announcement(data) {
    return layout({
      title: data.title || 'Duyuru',
      preview: data.preview || 'Yeni sistem duyurusu',
      bodyHtml: `${p(`Merhaba ${data.name || ''},`)}${p(data.body || '')}`,
      cta: { href: data.url || `${MAIL_BRAND.appUrl()}/duyurular`, label: 'Duyuruları gör' },
    })
  },
  invoice_created(data) {
    return layout({
      title: 'Faturanız oluşturuldu',
      preview: data.invoiceNumber || 'Yeni fatura',
      bodyHtml: `${p(`Merhaba ${data.name || ''},`)}${p('Yeni faturanız hazır.')}${strongLine('Fatura No', data.invoiceNumber || '—')}${strongLine('Tutar', data.amount || '—')}${strongLine('Tarih', data.issuedAt || '—')}`,
      cta: {
        href: data.invoiceUrl || `${MAIL_BRAND.appUrl()}/profil/paketim`,
        label: 'Faturayı gör',
      },
    })
  },
  trial_ending(data) {
    return layout({
      title: 'Deneme süresi bitiyor',
      preview: `${data.daysLeft ?? '—'} gün kaldı`,
      bodyHtml: `${p(`Merhaba ${data.name || ''},`)}${p('Ücretsiz deneme süreniz yakında sona erecek. Verilerinizi korumak ve kesintisiz devam etmek için bir paket seçin.')}${strongLine('Kalan', `${data.daysLeft ?? '—'} gün`)}${strongLine('Bitiş', data.endDate || '—')}`,
      cta: { href: `${MAIL_BRAND.appUrl()}/paketler`, label: 'Paket seç' },
    })
  },
  test(data) {
    return layout({
      title: 'BACHMAIN test e-postası',
      preview: 'Mail altyapısı başarıyla çalışıyor.',
      bodyHtml: `${p('Bu bir test mesajıdır.')}${strongLine('Ortam', data.env || process.env.VERCEL_ENV || process.env.NODE_ENV || 'unknown')}${strongLine('Zaman', new Date().toISOString())}${p('Resend üzerinden BACHMAIN üretim mail katmanı hazır.')}`,
      cta: { href: MAIL_BRAND.adminUrl(), label: 'Yönetim paneli' },
    })
  },
}

export function renderMailTemplate(templateKey, data = {}) {
  const fn = MAIL_TEMPLATES[templateKey]
  if (!fn) {
    const err = new Error(`Bilinmeyen şablon: ${templateKey}`)
    err.code = 'UNKNOWN_TEMPLATE'
    throw err
  }
  return fn(data)
}

export function listMailTemplates() {
  return Object.keys(MAIL_TEMPLATES)
}
