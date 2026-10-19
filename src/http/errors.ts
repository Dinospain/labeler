import type { ErrorRequestHandler, RequestHandler } from 'express'
import { ZodError } from 'zod'

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

export const badRequest = (message: string) => new HttpError(400, message)
export const notFound = (message = 'Not found') => new HttpError(404, message)

/** Все неизвестные /api/* маршруты → JSON 404 */
export const apiNotFound: RequestHandler = (_req, res) => {
  res.status(404).json({ error: 'Not found' })
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  if (res.headersSent) return next(err)
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message })
  }
  if (err instanceof ZodError) {
    const message = err.issues.map((i) => `${i.path.join('.') || 'body'}: ${i.message}`).join('; ')
    return res.status(400).json({ error: message, issues: err.issues })
  }
  // битый JSON в теле запроса (body-parser)
  if (err && typeof err === 'object' && (err as any).type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON body' })
  }
  console.error('[ERROR]', err)
  res.status(500).json({ error: 'Internal server error' })
}
