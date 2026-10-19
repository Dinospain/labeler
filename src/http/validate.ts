import type { ZodTypeAny, z } from 'zod'
import { badRequest } from './errors'

/** Разбор тела запроса; ZodError превращается в 400 в errorHandler */
export function parseBody<S extends ZodTypeAny>(schema: S, body: unknown): z.infer<S> {
  return schema.parse(body ?? {})
}

/** Положительный целый :id из URL, иначе 400 */
export function parseIdParam(raw: string | undefined): number {
  if (!raw || !/^\d+$/.test(raw)) throw badRequest('Invalid id')
  const id = Number(raw)
  if (!Number.isSafeInteger(id) || id <= 0) throw badRequest('Invalid id')
  return id
}
