import type { z } from 'zod'

export type InferDoc<TSchema extends z.ZodObject<z.ZodRawShape>> = z.infer<TSchema>
