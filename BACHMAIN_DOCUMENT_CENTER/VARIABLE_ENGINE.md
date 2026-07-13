# Variable Engine

Safe mustache resolver — no `eval`.

## API

- `resolveTemplateString(input, context, errors)`
- `buildDocumentContext({ company, user, customer, document, lineItems })`
- `renderTemplateHtml(template, context)`

## Catalog

See `src/data/docVariableCatalog.js` for module field groups (company, customer, quote, order, warehouse, production, HR, project, …).

## Tokens

`{{sirket.unvan}}`, `{{musteri.unvan}}`, `{{belge.no}}`, `{{belge.toplam}}`, `{{kalemler_html}}`

Conditionals: `{{#if musteri.telefon}}...{{/if}}`
