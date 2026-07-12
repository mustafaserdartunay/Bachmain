# 12 — AI Designer

## Amaç
Kullanıcı metin prompt’u ile şablon iskeleti üretir.

## Örnek prompt
“A4 teklif: üstte logo ve firma, müşteri kutusu, kalem tablosu, altta toplam ve imza.”

## Akış
1. Prompt + docType + dil (TR).
2. AI → Template JSON (layers).
3. Kullanıcı canvas’ta düzenler → Kaydet.

## Teknik
- Mevcut OpenAI proxy (`server/voiceChat` / omni) benzeri `/api/doc/ai-design`.
- Çıktı strict JSON schema; hallucinated binding’ler Variable Engine whitelist’e map edilir.

## Sınırlar
- Logo üretmez; `{{sirket.logo}}` yerleştirir.
- Kullanıcı onayı olmadan canlı belgeye basılmaz.
