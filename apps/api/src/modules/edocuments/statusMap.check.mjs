/** Standalone mapping checks — does not call Nilvera. */
const UI_STATUS = {
  DRAFT: 'DRAFT',
  PROCESSING: 'PROCESSING',
  SENT: 'SENT',
  RECEIVED: 'RECEIVED',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
  ERROR: 'ERROR',
}

function mapNilveraStatus(input) {
  if (input.isCancel) return UI_STATUS.CANCELLED
  const status = String(input.statusCode || '').toLowerCase()
  const answer = String(input.answerCode || '').toLowerCase()
  if (status === 'error') return UI_STATUS.ERROR
  if (answer === 'rejected') return UI_STATUS.REJECTED
  if (answer === 'approved' || answer === 'documentansweredautomatically') return UI_STATUS.ACCEPTED
  if (status === 'waiting' || answer === 'waitingforapproval') return UI_STATUS.PROCESSING
  if (status === 'succeed' || status === 'succeeded') {
    return input.direction === 'incoming' ? UI_STATUS.RECEIVED : UI_STATUS.SENT
  }
  return UI_STATUS.PROCESSING
}

const cases = [
  [{ isCancel: true }, UI_STATUS.CANCELLED],
  [{ statusCode: 'error' }, UI_STATUS.ERROR],
  [{ answerCode: 'rejected' }, UI_STATUS.REJECTED],
  [{ answerCode: 'approved' }, UI_STATUS.ACCEPTED],
  [{ statusCode: 'succeed', direction: 'incoming' }, UI_STATUS.RECEIVED],
  [{ statusCode: 'succeed', direction: 'outgoing' }, UI_STATUS.SENT],
  [{ statusCode: 'waiting' }, UI_STATUS.PROCESSING],
]

for (const [input, expected] of cases) {
  const got = mapNilveraStatus(input)
  if (got !== expected) {
    console.error('FAIL', input, got, expected)
    process.exit(1)
  }
}
console.log('edocument status mapping ok')
