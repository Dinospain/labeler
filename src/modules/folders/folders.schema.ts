import { z } from 'zod'

export const folderSchema = z.object({
  name: z.string({ required_error: 'name is required' }).trim().min(1, 'name is required'),
})
