import assert from 'node:assert/strict'
import {
  buildChatCompletionBody,
  buildResponsesBody,
  ensureJsonWordInChatMessages,
  ensureJsonWordInResponsesInput,
} from '../server/openaiModels.js'

// System-only JSON prompt (voice/growth) must still put "json" into Responses input
const voiceLike = [
  { role: 'system', content: 'Yanıtını HER ZAMAN şu JSON formatında ver.' },
  { role: 'user', content: 'Yeni müşteri oluştur: Acme' },
]

const responsesBody = buildResponsesBody({
  model: 'gpt-5.5-pro',
  messages: voiceLike,
  json: true,
})

assert.equal(responsesBody.text?.format?.type, 'json_object')
assert.ok(
  responsesBody.input.some((row) => /json/i.test(row.content)),
  'Responses input must contain the word json',
)

const chatBody = buildChatCompletionBody({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Listele' }],
  json: true,
})
assert.equal(chatBody.response_format?.type, 'json_object')
assert.ok(
  chatBody.messages.some((row) => /json/i.test(row.content)),
  'Chat messages must contain the word json',
)

const alreadyOk = ensureJsonWordInResponsesInput([
  { role: 'user', content: 'Return JSON please' },
])
assert.equal(alreadyOk.length, 1)
assert.match(alreadyOk[0].content, /Return JSON please/)

const nudged = ensureJsonWordInChatMessages([{ role: 'assistant', content: 'Merhaba' }])
assert.ok(nudged.some((row) => /json/i.test(row.content)))

console.log('ok: openai json_object input guard')
