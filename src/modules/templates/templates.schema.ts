import { z } from 'zod'

export const createTemplateSchema = z.object({
  name: z.string().min(1),
  html: z.string().min(1),
  isCurrent: z.boolean().optional(),
})

export const updateTemplateSchema = z.object({
  name: z.string().min(1).optional(),
  html: z.string().min(1).optional(),
  isCurrent: z.boolean().optional(),
})

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>
