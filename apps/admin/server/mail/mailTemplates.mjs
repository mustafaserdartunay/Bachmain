import { MAIL_BRAND } from './mailConfig.mjs'
import { logoImgSrc, publicLogoUrl } from './mailAssets.mjs'

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function logoBlock() {
  const b = MAIL_BRAND
  const src = logoImgSrc()
  const fallback = publicLogoUrl()
  // CID primary; HTTPS also listed for clients that prefer remote (same file).
  return `<a href="${escapeHtml(b.webUrl())}" style="text-decoration:none;border:0;outline:none" target="_blank" rel="noopener">
            <img
              src="${escapeHtml(src)}"
              alt="BACHMAIN"
              width="${b.logoWidth}"
              height="${b.logoHeight}"
              style="display:block;margin:0 auto;border:0;outline:none;text-decoration:none;height:${b.logoHeight}px;width:auto;max-width:240px"
            />
          </a>
          <!-- fallback url: ${escapeHtml(fallback)} -->`
}

function layout({ title, preview, bodyHtml, cta }) {
  const b = MAIL_BRAND
  const ctaHtml = cta?.href
    ? `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:28px auto 8px">
        <tr>
          <td align="center" style="border-radius:12px;background:${b.accent}">
            <a href="${escapeHtml(cta.href)}" style="display:inline-block;padding:14px 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:12px;line-height:1.2">${escapeHtml(cta.label || 'Devam et')}</a>
          </td>
        </tr>
      </table>`
    : ''

  return {
    subject: title,
    text: [title, preview, cta?.href, `${b.name} — ${b.slogan}`, b.webUrl()]
      .filter(Boolean)
      .join('\n\n'),
    html: `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta http-equiv="x-ua-compatible" content="ie=edge"/>
<title>${escapeHtml(title)}</title>
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background:${b.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${b.ink};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all">${escapeHtml(preview || '')}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${b.bg};padding:28px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background:${b.card};border-radius:16px;overflow:hidden;border:1px solid ${b.border}">
        <!-- accent bar -->
        <tr>
          <td style="height:4px;line-height:4px;font-size:0;background:${b.accent}">&nbsp;</td>
        </tr>
        <!-- logo header (light — original wordmark) -->
        <tr>
          <td align="center" style="padding:28px 32px 20px;background:#ffffff">
            ${logoBlock()}
            <p style="margin:12px 0 0;font-size:12px;font-weight:600;letter-spacing:0.02em;color:${b.muted}">${escapeHtml(b.slogan)}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:0 32px">
            <div style="height:1px;background:${b.border};line-height:1px;font-size:0">&nbsp;</div>
          </td>
        </tr>
        <!-- body -->
        <tr>
          <td style="padding:28px 32px 12px">
            <h1 style="margin:0 0 14px;font-size:22px;line-height:1.3;font-weight:800;color:${b.primary};letter-spacing:-0.02em">${escapeHtml(title)}</h1>
            <div style="font-size:15px;line-height:1.65;color:${b.ink}">${bodyHtml}</div>
            ${ctaHtml}
          </td>
        </tr>
        <!-- footer -->
        <tr>
          <td style="padding:20px 32px 28px">
            <div style="height:1px;background:${b.border};margin-bottom:18px;line-height:1px;font-size:0">&nbsp;</div>
            <p style="margin:0 0 8px;font-size:12px;line-height:1.55;color:${b.muted};text-align:center">
              Bu e-posta BACHMAIN hesabınızla ilişkilidir.
            </p>
            <p style="margin:0;font-size:12px;line-height:1.55;color:${b.muted};text-align:center">
              Yardım: <a href="mailto:${escapeHtml(b.supportEmail())}" style="color:${b.accent};text-decoration:none;font-weight:600">${escapeHtml(b.supportEmail())}</a>
              &nbsp;·&nbsp;
              <a href="${escapeHtml(b.webUrl())}" style="color:${b.accent};text-decoration:none;font-weight:600">bachmain.com</a>
            </p>
          </td>
        </tr>
      </table>
      <p style="margin:16px 0 0;font-size:11px;color:#94a3b8;text-align:center">
        © ${new Date().getFullYear()} BACHMAIN · ${escapeHtml(b.slogan)}
      </p>
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
      preview: 'Şifrenizi yenilemek için güvenli bağlantı.',
      bodyHtml: `${p(`Merhaba ${data.name || ''},`)}${p('Şifre sıfırlama talebi aldık. Siz değilseniz bu e-postayı yok sayın.')}`,
      cta: { href: data.resetUrl, label: 'Şifreyi sıfırla' },
    })
  },
  password_changed(data) {
    return layout({
      title: 'Şifreniz değiştirildi',
      preview: 'Hesap şifreniz güncellendi.',
      bodyHtml: `${p(`Merhaba ${data.name || ''},`)}${p('BACHMAIN hesap şifreniz başarıyla değiştirildi. Bu işlemi siz yapmadıysanız hemen destek ile iletişime geçin.')}`,
      cta: { href: data.appUrl || MAIL_BRAND.appUrl(), label: 'Hesaba giriş' },
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
      bodyHtml: `${p('Bu bir test mesajıdır.')}${strongLine('Ortam', data.env || process.env.VERCEL_ENV || process.env.NODE_ENV || 'unknown')}${strongLine('Zaman', new Date().toISOString())}${p('Resend üzerinden BACHMAIN üretim mail katmanı hazır. Logo CID + HTTPS yedek ile gönderilir.')}`,
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
