# BachMain Knowledge Platform — Gap Report

**Version:** 2026-07-20 Enterprise  
**Status:** Foundation in progress (KP-0)  
**Constraint:** Additive · RBAC-scoped · Do not break Document Center (templates/print) or AIOS

## 1. Goal

AI must not rely only on public pretraining. BachMain indexes **company knowledge** (documents, quotes, orders, CRM notes, logistics, templates, …) into one searchable layer with RAG + MCP-compatible tools.

## 2. What exists today

| Capability              | Reality                                        | Gap                                  |
| ----------------------- | ---------------------------------------------- | ------------------------------------ |
| Document Center         | `/belge-merkezi` — templates, designers, print | Not a RAG knowledge index            |
| AIOS memory             | `aios_memory` scoped KV                        | Not document chunks / embeddings     |
| AIOS tools              | Registry + stubs                               | No `search_documents` / RAG retrieve |
| File upload / OCR       | Partial in CRM modules                         | No central pipeline                  |
| Embedding index         | None                                           | Missing                              |
| Natural-language search | None                                           | Missing                              |
| Doc↔entity links        | Ad-hoc per module                              | No unified graph                     |
| Version compare         | Doc Center template versions only              | Need knowledge doc versions          |

## 3. Separation of concerns

| Layer                  | Role                                 |
| ---------------------- | ------------------------------------ |
| **Document Center**    | Design & print templates             |
| **Knowledge Platform** | Index, OCR, RAG, wiki, FAQ, policies |
| **AIOS**               | Agents call Knowledge via MCP tools  |

## 4. Priority gaps

| ID  | Gap                                      | Sev |
| --- | ---------------------------------------- | --- |
| K1  | `knowledge_*` tables + API               | P0  |
| K2  | Knowledge Center UI                      | P0  |
| K3  | Lexical search + RAG prompt assembly     | P0  |
| K4  | MCP tool catalog (`search_documents`, …) | P0  |
| K5  | Scope RBAC (company/branch/role)         | P0  |
| K6  | OCR / parse pipeline                     | P1  |
| K7  | Real embeddings (pgvector / external)    | P1  |
| K8  | Cross-module auto-index (quotes/orders)  | P2  |
| K9  | Video / CAD deep parsers                 | P3  |

## 5. Compatibility

- Do not rewrite `/belge-merkezi`.
- AIOS gateway remains the only model egress; Knowledge feeds **context**, not keys.
- Secrets/PII still masked before model (AIOS `maskSensitiveText`).
