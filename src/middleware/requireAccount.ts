import type { RequestHandler } from 'express'

/** Единый гард: без аккаунта — 401 */
export const requireAccount: RequestHandler = (req, res, next) => {
  if (!req.account) {
    return res.status(401).json({ error: 'Not authenticated (missing X-Account header)' })
  }
  next()
}
