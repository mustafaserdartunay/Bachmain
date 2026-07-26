# Neon / DATABASE_URL — tamamlandı (2026-07-26)

## Yapılanlar

1. Mevcut Neon projesi kullanıldı: `bachmain` (`cold-frog-79803695`, `aws-eu-central-1`)
2. Yanlışlıkla oluşan ikinci proje silindi
3. Yerel env güncellendi: `apps/api/.env`, `apps/admin/.env`, kök `.env`
4. Drizzle migrasyonları Neon’a uygulandı (0013 `headline`/`severity` bug fix)
5. Tenant RLS uygulandı (`0018_tenant_rls.sql`) — customers, products, memberships, activity_logs vb.
6. Admin `tenant_data` şeması doğrulandı (`ensureSchema`)
7. Vercel:
   - `bachmain` + `admin` projelerine `DATABASE_URL` eklendi
   - `bachmain-admin` (`yonetim.bachmain.com`) zaten `DATABASE_URL` içeriyordu
   - Preview’a `VITE_CRM_DUAL_WRITE=1` eklendi (`bachmain` projesi)
8. Yerel `.env`: `VITE_CRM_DUAL_WRITE=1`, `VITE_CRM_READ_SOURCE=local`

## Sonraki (kod deploy)

Tenant API wiring + güvenlik değişikliklerinin production’a gitmesi için:

```bash
# admin (yonetim)
cd apps/admin && npx vercel --prod --yes

# CRM (uygulama) — dual-write preview’da açık; prod flag ayrı onay
```

## Notlar

- `VITE_CRM_READ_SOURCE=api` henüz açılmadı (güvenli cutover sırası).
- R2 / Sentry DSN hâlâ opsiyonel.
- Production CRM’de dual-write için `VITE_CRM_DUAL_WRITE=1` production env’e ayrıca eklenmeli (şimdilik sadece Preview).
