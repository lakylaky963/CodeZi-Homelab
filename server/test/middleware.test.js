import test from 'node:test'
import assert from 'node:assert/strict'
import { createRateLimiter } from '../src/middleware/rateLimit.js'
import { securityHeaders } from '../src/middleware/securityHeaders.js'

const mockRes = () => {
  const res = { headers: {}, statusCode: 200, body: undefined }
  res.setHeader = (k, v) => { res.headers[k] = v }
  res.status = (c) => { res.statusCode = c; return res }
  res.json = (b) => { res.body = b; return res }
  return res
}

const hit = (limiter, ip) => {
  const res = mockRes()
  let nextCalled = false
  limiter({ ip }, res, () => { nextCalled = true })
  return { res, nextCalled }
}

test('16th request in window gets 429 with Retry-After and JSON error', () => {
  const limiter = createRateLimiter({ max: 15, windowMs: 15 * 60 * 1000 })
  try {
    for (let i = 1; i <= 15; i++) assert.equal(hit(limiter, '1.1.1.1').nextCalled, true, `request ${i}`)
    const { res, nextCalled } = hit(limiter, '1.1.1.1')
    assert.equal(nextCalled, false)
    assert.equal(res.statusCode, 429)
    assert.deepEqual(res.body, { error: 'Too many requests, try again later' })
    assert.ok(Number(res.headers['Retry-After']) >= 1)
  } finally { limiter.stop() }
})

test('limits are per client IP', () => {
  const limiter = createRateLimiter({ max: 2 })
  try {
    hit(limiter, 'a'); hit(limiter, 'a')
    assert.equal(hit(limiter, 'a').res.statusCode, 429)
    assert.equal(hit(limiter, 'b').nextCalled, true)
  } finally { limiter.stop() }
})

test('window slides: requests allowed again after expiry', () => {
  let t = 1000
  const limiter = createRateLimiter({ max: 2, windowMs: 1000, now: () => t })
  try {
    hit(limiter, 'a'); t += 400; hit(limiter, 'a')
    assert.equal(hit(limiter, 'a').res.statusCode, 429)
    t += 700 // first hit (t=1000) expired, second (1400) still in window
    assert.equal(hit(limiter, 'a').nextCalled, true)
    assert.equal(hit(limiter, 'a').res.statusCode, 429)
  } finally { limiter.stop() }
})

test('cleanup keeps memory bounded', () => {
  let t = 0
  const limiter = createRateLimiter({ max: 5, windowMs: 1000, now: () => t })
  try {
    for (let i = 0; i < 100; i++) hit(limiter, `ip${i}`)
    assert.equal(limiter.size(), 100)
    t += 5000
    limiter.cleanup()
    assert.equal(limiter.size(), 0)
  } finally { limiter.stop() }
})

test('security headers set and next called', () => {
  const res = mockRes()
  let called = false
  securityHeaders({}, res, () => { called = true })
  assert.ok(called)
  assert.equal(res.headers['X-Content-Type-Options'], 'nosniff')
  assert.equal(res.headers['X-Frame-Options'], 'SAMEORIGIN')
  assert.equal(res.headers['Referrer-Policy'], 'strict-origin-when-cross-origin')
  assert.equal(res.headers['Permissions-Policy'], 'camera=(), microphone=(), geolocation=()')
})
