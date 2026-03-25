import type { z } from 'zod'

export type InferDoc<TSchema extends z.ZodObject<z.ZodRawShape>> = z.infer<TSchema>

export interface FindOptions {
  sort?: Record<string, 1 | -1>
  skip?: number
  limit?: number
}
