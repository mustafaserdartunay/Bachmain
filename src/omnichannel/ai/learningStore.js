import { STORAGE_KEYS } from '../schema'

const MAX_EXAMPLES = 80
const MAX_FEEDBACK = 200

function readLearning() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.aiLearning) || '{}')
    return {
      examples: Array.isArray(saved.examples) ? saved.examples : [],
      feedback: Array.isArray(saved.feedback) ? saved.feedback : [],
    }
  } catch {
    return { examples: [], feedback: [] }
  }
}

function writeLearning(data) {
  localStorage.setItem(STORAGE_KEYS.aiLearning, JSON.stringify(data))
  window.dispatchEvent(new CustomEvent('bach:omni-ai-learning-updated'))
}

export function getLearningExamplesForPrompt(limit = 12) {
  const { examples } = readLearning()
  return examples
    .sort((a, b) => (b.score || 0) - (a.score || 0) || new Date(b.at) - new Date(a.at))
    .slice(0, limit)
}

export function recordAcceptedReply({
  customerMessage = '',
  suggestion = '',
  finalText = '',
  channel = '',
  conversationId = '',
}) {
  const text = String(finalText || suggestion || '').trim()
  if (!text) return

  const data = readLearning()
  const existing = data.examples.find(
    (item) => item.reply === text && item.customerMessage === customerMessage,
  )

  if (existing) {
    existing.score = (existing.score || 1) + 1
    existing.at = new Date().toISOString()
  } else {
    data.examples.unshift({
      id: `LE-${Date.now()}`,
      customerMessage: String(customerMessage).slice(0, 300),
      reply: text,
      suggestion: String(suggestion).slice(0, 500),
      wasEdited: Boolean(suggestion && finalText && suggestion.trim() !== finalText.trim()),
      channel,
      conversationId,
      score: 1,
      at: new Date().toISOString(),
    })
  }

  data.examples = data.examples.slice(0, MAX_EXAMPLES)
  writeLearning(data)
}

export function recordFeedback({
  conversationId = '',
  suggestion = '',
  rating = 'up',
  channel = '',
}) {
  const data = readLearning()
  data.feedback.unshift({
    id: `FB-${Date.now()}`,
    conversationId,
    suggestion: String(suggestion).slice(0, 500),
    rating,
    channel,
    at: new Date().toISOString(),
  })
  data.feedback = data.feedback.slice(0, MAX_FEEDBACK)
  writeLearning(data)

  if (rating === 'up' && suggestion) {
    recordAcceptedReply({
      customerMessage: '',
      suggestion,
      finalText: suggestion,
      channel,
      conversationId,
    })
  }
}

export function getLearningStats() {
  const { examples, feedback } = readLearning()
  const positive = feedback.filter((item) => item.rating === 'up').length
  const negative = feedback.filter((item) => item.rating === 'down').length
  return {
    exampleCount: examples.length,
    feedbackCount: feedback.length,
    positiveFeedback: positive,
    negativeFeedback: negative,
  }
}
