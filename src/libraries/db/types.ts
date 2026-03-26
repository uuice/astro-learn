import type { z } from 'zod'

/** `createModel` 里 Zod 对象 schema 对应的单条文档类型。 */
export type InferDoc<TSchema extends z.ZodObject<z.ZodRawShape>> = z.infer<TSchema>
