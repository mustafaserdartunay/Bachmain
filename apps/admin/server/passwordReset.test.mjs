/**
 * Password-reset production hardening tests (admin auth store).
 * Run: node --experimental-vm-modules apps/admin/server/passwordReset.test.mjs
 * or:  node apps/admin/server/passwordReset.test.mjs
 */
import assert from 'node:assert/strict'
import {
  hashOpaqueToken,
  hashPassword,
  verifyPassword,
  validateSignupPassword,
  requestPasswordReset,
  resetPasswordWithToken,
  getAccountFromToken,
  signToken,
  listPasswordResetEvents,
} from './auth.mjs'

let mailCalls = []

// Soft-stub sendTemplateMail via dynamic mock of mailService is heavy;
// requestPasswordReset imports sendTemplateMail at module load.
// Instead we allow mail to fail gracefully when no RESEND key — store still updates.

function emptyStore() {
  return {
    accounts: [
      {
        id: 'acc_1',
        email: 'user@bachmain.test',
        fullName: 'Test User',
        customerId: 'cus_1',
        tenantCode: 't1',
        role: 'owner',
        passwordHash: hashPassword('OldPass1!'),
        sessionVersion: 0,
      },
    ],
    customers: [{ id: 'cus_1', name: 'Test Co' }],
    emailTokens: [],
    authEvents: [],
    customerExtras: { loginHistory: [] },
    mail: { queue: [], logs: [] },
  }
}

function assertThrows(fn, code) {
  let threw = false
  try {
    fn()
  } catch (e) {
    threw = true
    if (code) assert.equal(e.code, code)
  }
  assert.equal(threw, true, `expected throw ${code || ''}`)
}

async function assertRejects(promise, code) {
  let err
  try {
    await promise
  } catch (e) {
    err = e
  }
  assert.ok(err, 'expected rejection')
  if (code) assert.equal(err.code, code)
}

async function run() {
  console.log('→ password policy')
  assert.equal(validateSignupPassword('short').ok, false)
  assert.equal(validateSignupPassword('noupper1!').ok, false)
  assert.equal(validateSignupPassword('NOLOWER1!').ok, false)
  assert.equal(validateSignupPassword('NoDigit!!').ok, false)
  assert.equal(validateSignupPassword('NoSpecial1').ok, false)
  assert.equal(validateSignupPassword('GoodPass1!').ok, true)

  console.log('→ token hash is deterministic & not reversible')
  const a = hashOpaqueToken('abc')
  const b = hashOpaqueToken('abc')
  const c = hashOpaqueToken('xyz')
  assert.equal(a, b)
  assert.notEqual(a, c)
  assert.equal(a.length, 64)

  console.log('→ password hash')
  const h = hashPassword('Secret1!')
  assert.ok(verifyPassword('Secret1!', h))
  assert.equal(verifyPassword('wrong', h), false)

  console.log('→ forgot: unknown email still ok (no enumeration)')
  const store = emptyStore()
  const r1 = await requestPasswordReset(store, 'nobody@bachmain.test', {
    ip: '1.1.1.1',
    userAgent: 'test',
  })
  assert.equal(r1.ok, true)
  assert.equal(store.emailTokens.length, 0)
  assert.equal(store.authEvents[0].result, 'no_account')

  console.log('→ forgot: known email creates hashed token (30m) without plaintext')
  // Monkey-patch: sendTemplateMail may queue when no API key — that's ok
  const before = store.emailTokens.length
  await requestPasswordReset(store, 'user@bachmain.test', { ip: '2.2.2.2', userAgent: 'Chrome' })
  assert.ok(store.emailTokens.length > before)
  const tok = store.emailTokens[0]
  assert.equal(tok.purpose, 'reset')
  assert.ok(tok.tokenHash)
  assert.equal(tok.token, undefined)
  assert.equal(tok.usedAt, null)
  const ttlMs = new Date(tok.expiresAt).getTime() - new Date(tok.createdAt).getTime()
  assert.ok(ttlMs <= 30 * 60 * 1000 + 1000)
  assert.ok(ttlMs >= 29 * 60 * 1000)

  // Recover raw token from mail queue/logs if present; otherwise forge via hash match by
  // creating a known token in a controlled way:
  const raw = 'a'.repeat(64)
  store.emailTokens[0].tokenHash = hashOpaqueToken(raw)

  console.log('→ reset: invalid token')
  await assertRejects(
    resetPasswordWithToken(store, { token: 'bad', password: 'NewPass1!' }),
    'INVALID_TOKEN',
  )

  console.log('→ reset: expired token')
  store.emailTokens[0].expiresAt = new Date(Date.now() - 1000).toISOString()
  await assertRejects(
    resetPasswordWithToken(store, { token: raw, password: 'NewPass1!' }),
    'TOKEN_EXPIRED',
  )
  store.emailTokens[0].expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString()

  console.log('→ reset: weak password')
  await assertRejects(
    resetPasswordWithToken(store, { token: raw, password: 'weak' }),
    'WEAK_PASSWORD',
  )

  console.log('→ reset: success + session invalidation + used flag')
  const oldJwt = signToken({
    sub: 'acc_1',
    email: 'user@bachmain.test',
    customerId: 'cus_1',
    tenantCode: 't1',
    role: 'owner',
    sv: 0,
  })
  assert.ok(getAccountFromToken(store, oldJwt))

  await resetPasswordWithToken(store, {
    token: raw,
    password: 'NewPass1!',
    ip: '3.3.3.3',
    userAgent: 'Safari',
  })
  assert.ok(verifyPassword('NewPass1!', store.accounts[0].passwordHash))
  assert.equal(store.accounts[0].sessionVersion, 1)
  assert.ok(store.emailTokens[0].usedAt)
  assert.equal(getAccountFromToken(store, oldJwt), null)

  console.log('→ reset: replay blocked')
  await assertRejects(
    resetPasswordWithToken(store, { token: raw, password: 'Another1!' }),
    'TOKEN_USED',
  )

  console.log('→ admin list filters')
  const all = listPasswordResetEvents(store, {})
  assert.ok(all.length >= 2)
  const byEmail = listPasswordResetEvents(store, { email: 'user@bachmain.test' })
  assert.ok(byEmail.every((e) => e.email === 'user@bachmain.test'))
  const byCust = listPasswordResetEvents(store, { customerId: 'cus_1' })
  assert.ok(byCust.every((e) => !e.customerId || e.customerId === 'cus_1'))

  console.log('\n✅ password reset tests passed')
}

run().catch((err) => {
  console.error('\n❌', err)
  process.exit(1)
})
