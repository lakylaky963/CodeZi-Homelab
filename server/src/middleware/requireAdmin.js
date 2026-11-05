import { timingSafeEqual } from 'crypto'

// Renaming and deleting users need the homelab main password (ADMIN_PASSWORD in server/.env).
// Until ADMIN_PASSWORD is set, everything stays open as before.
export const requireAdmin = (req, res, next) => {
  const expected = process.env.ADMIN_PASSWORD
  if (!expected) return next()
  const given = Buffer.from(req.get('x-admin-password') || '')
  const want = Buffer.from(expected)
  if (given.length === want.length && timingSafeEqual(given, want)) return next()
  return res.status(401).json({ message: 'Admin password required' })
}
