# Belge Merkezi (Document Center)

Enterprise no-code document platform for BachMain ERP & CRM.

## Entry

**Ayarlar → Belge Merkezi**

## Live modules

| Module | Path | Status |
|--------|------|--------|
| Dashboard | `/belge-merkezi` | Live |
| Templates | `/belge-merkezi/sablonlar` | Live |
| Document Designer | `/belge-merkezi/tasarimci` | Live (visual + HTML) |
| Label Designer | `/belge-merkezi/etiket` | Live |
| Print / PDF | `/belge-merkezi/yazdir` | Live |
| Print jobs | `/belge-merkezi/kayitlar` | Live |
| Barcode / QR / PDF / Email / WA / Profiles / Variables / Components / Assets / Fonts / Themes / Workflow / Permissions / Marketplace / Versions / Archive | under `/belge-merkezi/*` | Scaffold (shell) |

## Architecture

- Templates: `erlenbox-doc-templates` (workspace sync)
- Visual blocks: `template.blocks[]` + `designMode: 'visual'`
- HTML fallback: `headerHtml` / `bodyHtml` / `footerHtml`
- Render: `docVariableEngine.renderTemplateHtml` → blocks or HTML
- Canvas: `docCanvasEngine` (px page presets A4/A5/Letter)
- Elements: `docDesignerElements`
- Variables: `docVariableCatalog`

## Designer UX

Left: elements + variables + layers  
Center: page canvas (grid, snap, drag, resize)  
Right: property inspector  
Toolbar: undo / redo / zoom / preview / save
