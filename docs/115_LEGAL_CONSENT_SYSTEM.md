# 115 — Legal Consent & Document System

## Purpose

Production legal document hosting, versioned consents, payment/demo/register gates, cookie preferences, admin CMS, and CRM “Sözleşmelerim”.

**Lawyer notice (required in UI + admin):**  
“Bu sözleşmeler yayına alınmadan önce KVKK, e-Ticaret ve Tüketici Hukuku alanında uzman bir avukat tarafından kontrol edilmelidir.”

Drafts are TR-law oriented templates, not legal advice.

## Document types / routes

| slug                    | type key          |
| ----------------------- | ----------------- |
| kullanim-kosullari      | terms_of_use      |
| hizmet-sozlesmesi       | service_agreement |
| gizlilik-politikasi     | privacy_policy    |
| kvkk-aydinlatma-metni   | kvkk_notice       |
| cerez-politikasi        | cookie_policy     |
| acik-riza-metni         | explicit_consent  |
| elektronik-ileti-onayi  | electronic_comms  |
| iptal-iade-politikasi   | cancel_refund     |
| demo-kullanim-kosullari | demo_terms        |
| veri-guvenligi          | data_security     |
| lisans-sozlesmesi       | license_agreement |

Aliases: `/gizlilik` → privacy, `/kvkk` → kvkk_notice.

## Consent packs

- **purchase**: service_agreement, terms_of_use, privacy_policy, kvkk_notice, cookie_policy, cancel_refund
- **demo**: demo_terms, kvkk_notice, privacy_policy, cookie_policy
- **register**: kvkk_notice, terms_of_use, privacy_policy

## Data (yonetim store SoT)

- `legal.company` — publisher company profile (editable)
- `legal.documents[]` — type, slug, title, status
- `legal.versions[]` — documentId, version, bodyHtml/markdown, publishedAt, revisionAt, supersedes
- `legal.consents[]` — accountId, customerId, type, version, ip, ua, device, os, lang, at
- `legal.cookiePreferences[]` — visitor/account prefs

## API (yonetim `/api`)

Public:

- `GET legal/documents`
- `GET legal/documents/:slug`
- `POST legal/consents` (authenticated or pre-auth token)
- `GET legal/consents/me`
- `GET legal/required` — outstanding consents for session
- `POST legal/cookies`

Staff:

- `GET|POST|PUT legal/admin/documents`
- `POST legal/admin/documents/:id/publish`
- `GET legal/admin/consents`

## Gates

1. Register form — checkbox links + server requires consent payload ids/versions
2. Demo form — demo pack scroll-accept or checkboxes with scroll modal for long texts
3. Payment — Contracts step before PaymentPanel; scroll-to-bottom per doc; all accepted → proceed
4. App login — if published version > last accepted → block until re-accept

## Security

Consent create validated server-side against published versions; client cannot invent version numbers.
