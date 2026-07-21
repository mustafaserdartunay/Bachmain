#!/usr/bin/env node
/** Call SMC queue tick — set SMC_API_URL + SMC_TOKEN */
const base = process.env.SMC_API_URL || process.env.API_PUBLIC_URL || 'http://127.0.0.1:8080'
const token = process.env.SMC_TOKEN || process.env.API_TOKEN
if (!token) {
  console.error('SMC_TOKEN required')
  process.exit(1)
}
const res = await fetch(`${base}/v1/social/internal/tick`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
})
const data = await res.json()
console.log(JSON.stringify(data, null, 2))
if (!res.ok) process.exit(1)
