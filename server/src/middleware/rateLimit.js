// Zero-dependency in-memory sliding-window rate limiter, keyed by client IP.
export const createRateLimiter = ({
  windowMs = 15 * 60 * 1000,
  max = 15,
  now = () => Date.now(),
  keyFn = (req) => req.ip || req.socket?.remoteAddress || 'unknown',
  cleanupIntervalMs = 60 * 1000,
} = {}) => {
  const hits = new Map() // key -> array of timestamps within the window

  const prune = (timestamps, current) => {
    const cutoff = current - windowMs
    let i = 0
    while (i < timestamps.length && timestamps[i] <= cutoff) i += 1
    if (i > 0) timestamps.splice(0, i)
  }

  const cleanup = () => {
    const current = now()
    for (const [key, timestamps] of hits) {
      prune(timestamps, current)
      if (timestamps.length === 0) hits.delete(key)
    }
  }

  // Periodic cleanup keeps memory bounded; unref so it never holds the process open.
  const timer = setInterval(cleanup, cleanupIntervalMs)
  timer.unref?.()

  const middleware = (req, res, next) => {
    const current = now()
    const key = keyFn(req)
    const timestamps = hits.get(key) || []
    prune(timestamps, current)

    if (timestamps.length >= max) {
      const retryAfter = Math.max(1, Math.ceil((timestamps[0] + windowMs - current) / 1000))
      hits.set(key, timestamps)
      res.setHeader('Retry-After', String(retryAfter))
      return res.status(429).json({ error: 'Too many requests, try again later' })
    }

    timestamps.push(current)
    hits.set(key, timestamps)
    return next()
  }

  middleware.cleanup = cleanup
  middleware.size = () => hits.size
  middleware.stop = () => clearInterval(timer)
  return middleware
}

export default createRateLimiter
