# BachMain JSON-LD Schema & AI Search Report

## 1. Schema components (`src/components/seo/schema`)

| Component                   | Role                                                    |
| --------------------------- | ------------------------------------------------------- |
| `OrganizationSchema`        | Organization (+ logo, ContactPoint, knowsAbout)         |
| `WebsiteSchema`             | WebSite (+ optional SearchAction)                       |
| `WebPageSchema`             | WebPage / ContactPage / CollectionPage                  |
| `SoftwareApplicationSchema` | SoftwareApplication + Offer                             |
| `ProductSchema`             | Product + AggregateOffer + standalone Offer             |
| `BreadcrumbSchema`          | BreadcrumbList (used by `<Breadcrumbs>`)                |
| `FAQSchema`                 | FAQPage                                                 |
| `SearchActionSchema`        | Standalone SearchAction (also embedded in Website)      |
| `ContactPointSchema`        | ContactPoint                                            |
| `ImageObjectSchema`         | ImageObject                                             |
| `VideoObjectSchema`         | VideoObject (only when real video provided)             |
| `HomeGraphSchema`           | Single `@graph`: Org + WebSite(+SearchAction) + SoftApp |
| `ArticleSchema`             | Article (blog posts)                                    |
| `RouteSchemas`              | Per-route orchestrator — loads only needed schemas      |

Builders / types (single source of truth):

- `src/seo/schema/builders.ts`
- `src/seo/schema/types.ts`
- `src/seo/schema/moduleFaqs.ts`
- `src/seo/schema/aiTopics.ts`
- Org constants: `src/seo/site.ts`

## 2. Schemas by page

| Page                                      | Schemas                                                                          |
| ----------------------------------------- | -------------------------------------------------------------------------------- |
| `/`                                       | Organization, WebSite, SearchAction (in WebSite), SoftwareApplication (`@graph`) |
| `/crm`                                    | SoftwareApplication, FAQPage, BreadcrumbList                                     |
| `/erp`                                    | SoftwareApplication, FAQPage, BreadcrumbList                                     |
| `/muhasebe`                               | SoftwareApplication, FAQPage, BreadcrumbList                                     |
| `/e-fatura`                               | SoftwareApplication, FAQPage, BreadcrumbList                                     |
| `/fiyatlar`                               | Product, Offer, SoftwareApplication, BreadcrumbList                              |
| `/iletisim`                               | Organization, ContactPoint, BreadcrumbList                                       |
| `/blog`                                   | CollectionPage (WebPage), BreadcrumbList                                         |
| `/blog/[slug]`                            | WebPage, Article, BreadcrumbList                                                 |
| `/uye-ol`                                 | WebPage, BreadcrumbList                                                          |
| `/giris`                                  | WebPage, BreadcrumbList                                                          |
| `/faq`                                    | FAQPage, BreadcrumbList                                                          |
| `/help`                                   | WebPage, BreadcrumbList (+ live `?q=` search for SearchAction)                   |
| `/demo`                                   | WebPage, BreadcrumbList                                                          |
| Other modules (`/stok`, `/depo`, …)       | SoftwareApplication, BreadcrumbList                                              |
| Legacy `/features/*`, `/modules/*`, legal | WebPage (or SoftApp if catalog says so), BreadcrumbList                          |

**Deduping:** Root layout no longer injects a global Organization/WebSite/SoftApp graph. SoftApp is not duplicated on home. Breadcrumb JSON-LD is emitted only by `<Breadcrumbs>`.

## 3. Key edited files

- `src/components/seo/schema/*` (new reusable components)
- `src/seo/schema/builders.ts`, `types.ts`, `moduleFaqs.ts`, `aiTopics.ts`
- `src/seo/jsonld.ts` (thin compat re-exports)
- `src/app/layout.tsx` (removed global JSON-LD)
- `src/components/seo/Breadcrumbs.tsx`, `SeoModuleView.tsx`
- `src/views/SupportPages.jsx` (Help search bound to `?q=`)
- All `src/app/**/page.tsx` routes wired via `RouteSchemas`

## 4. Google Rich Results — remaining gaps

- **Review / AggregateRating:** no real review corpus → intentionally omitted (fake ratings hurt trust).
- **VideoObject:** no production video URLs yet → component exists, not emitted.
- **Product rich results:** AggregateOffer present; Google may still want visible price + merchant details on `/fiyatlar` (already on page) — re-test in Rich Results Test after deploy.
- **FAQ rich results:** module FAQs are now **visible** on CRM/ERP/muhasebe/e-fatura (required by Google).
- **SearchAction:** targets `/help?q={search_term_string}` and the Help UI filters on `q`.
- **LocalBusiness:** BachMain is SaaS; Organization is used instead of LocalBusiness (no physical storefront schema).

## 5. AI Search — further recommendations

1. Add dedicated long-form guides (`/rehber/crm-nedir`, `/rehber/erp-nedir`, …) with HowTo / Article schema.
2. Publish authoritative comparison pages (CRM vs ERP, ön muhasebe vs e-fatura) with clear entity definitions.
3. Maintain a public `llms.txt` / `ai.txt` summarizing product capabilities and canonical URLs.
4. Add real customer case studies with `CaseStudy` / Article + Organization `knowsAbout` alignment.
5. Wire `sameAs` profiles to verified social / Crunchbase / Wikipedia when available.
6. Keep FAQ answers unique per URL (already done for the four core modules).
7. After deploy: validate home, `/crm`, `/fiyatlar`, `/faq`, one blog post in [Google Rich Results Test](https://search.google.com/test/rich-results).
