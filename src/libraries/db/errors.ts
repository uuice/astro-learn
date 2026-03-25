import type { z } from 'zod'

export class OrmValidationError extends Error {
  readonly zodError: z.ZodError

  constructor(message: string, zodError: z.ZodError) {
    super(message)
    this.name = 'OrmValidationError'
    this.zodError = zodError
  }
}
