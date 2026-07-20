# BachMain AI App Builder — Architecture & Roadmap

**Version:** 2026-07-20 Enterprise  
**Companion:** [100 Gap](./100_AI_APP_BUILDER_GAP_REPORT.md)

```mermaid
flowchart LR
  NL[Natural_Language] --> Draft[App_Builder_Draft]
  Draft --> Preview[Preview_Mode]
  Preview --> Publish[Publish_Stub]
  Publish --> Plugin[Plugin_SDK_Registry]
  Draft --> WF[/otomasyon/designer]
  Draft --> An[/analitik?tab=builder]
  Draft --> Doc[/belge-merkezi/tasarimci]
  Plugin --> Platform[Platform_Core]
```

## Routes

| Path                    | Purpose        |
| ----------------------- | -------------- |
| `/ai-uygulama`          | App Center hub |
| `/ai-app-builder`       | Alias          |
| `/aios?tab=app-builder` | AIOS deep-link |

## Hub tabs (AB-0)

| Tab                          | Role                               |
| ---------------------------- | ---------------------------------- |
| `home`                       | NL prompt + overview               |
| `applications`               | Draft apps list                    |
| `modules`                    | Module builder drafts              |
| `pages` / `forms` / `tables` | Spec stubs → future canvases       |
| `dashboards`                 | Deep-link Analytics builder        |
| `workflow`                   | Deep-link Workflow Designer        |
| `automation`                 | Deep-link WF + Platform automation |
| `api` / `integrations`       | Spec stubs                         |
| `designer`                   | AI UI brief stub                   |
| `preview`                    | Draft preview                      |
| `publish`                    | Publish → plugin stub              |
| `marketplace`                | Template packs                     |
| `templates`                  | Seed templates                     |
| `versions`                   | Version history stub               |

## API

| Method   | Path                            | Purpose               |
| -------- | ------------------------------- | --------------------- |
| GET      | `/v1/aios/app-builder/overview` | KPIs + catalog        |
| GET/POST | `/v1/aios/app-builder/drafts`   | List / create draft   |
| POST     | `/v1/aios/app-builder/nl`       | NL → scaffold draft   |
| POST     | `/v1/aios/app-builder/publish`  | Plugin publish intent |

## Phases

| Phase    | Scope                                                      |
| -------- | ---------------------------------------------------------- |
| **AB-0** | Hub · NL drafts · deep-links · publish stub · docs 100/101 |
| AB-1     | Form/Page/Table designers · business rules UI              |
| AB-2     | Runtime plugin loader · Marketplace · Code Assist          |

## Compatibility

Workflow Engine, Document Platform, Analytics, Platform Plugin Center remain SoT. App Builder composes and publishes extensions only.
