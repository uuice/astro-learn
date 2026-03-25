import { chain as lodashChain } from 'lodash'
import type { z } from 'zod'
import type { FindOptions, InferDoc } from './types.js'

/**
 * 链式查询（类似 Mongoose Query），与 lowdb 单例配合使用。
 * `await query` / `await model.find()` 会执行 `exec()`。
 */
/* eslint-disable no-unused-vars -- 构造器与 PromiseLike 签名 */
export class ModelQuery<TSchema extends z.ZodObject<z.ZodRawShape>>
  implements PromiseLike<InferDoc<TSchema>[]>
{
  private _filter: Partial<InferDoc<TSchema>> | undefined
  private _options: FindOptions = {}

  constructor(
    private readonly runFind: (
      filter?: Partial<InferDoc<TSchema>>,
      options?: FindOptions
    ) => Promise<InferDoc<TSchema>[]>,
    filter?: Partial<InferDoc<TSchema>>,
    initialOptions?: FindOptions
  ) {
    this._filter = filter
    if (initialOptions) this._options = { ...initialOptions }
  }

  /** 追加条件（与已有 filter 合并） */
  where(filter: Partial<InferDoc<TSchema>>): this {
    this._filter = { ...this._filter, ...filter }
    return this
  }

  sort(sort: Record<string, 1 | -1>): this {
    this._options.sort = sort
    return this
  }

  skip(n: number): this {
    this._options.skip = n
    return this
  }

  limit(n: number): this {
    this._options.limit = n
    return this
  }

  exec(): Promise<InferDoc<TSchema>[]> {
    return this.runFind(this._filter, this._options)
  }

  /**
   * 先执行当前查询，再对结果数组使用 `lodash.chain`。
   * 链上可继续 `.filter` / `.map` / `.orderBy` / `.take` 等，最后 `.value()` 取结果。
   *
   * @example
   * const ch = await model.find({ status: 'pending' }).chain()
   * const titles = ch.map('title').uniq().value()
   */
  /** @returns lodash 包装对象，末尾需 `.value()` / `.valueOf()` */
  async chain() {
    const rows = await this.exec()
    return lodashChain(rows)
  }

  then<TResult1 = InferDoc<TSchema>[], TResult2 = never>(
    onfulfilled?:
      | ((value: InferDoc<TSchema>[]) => TResult1 | PromiseLike<TResult1>)
      | null
      | undefined,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null | undefined
  ): Promise<TResult1 | TResult2> {
    return this.exec().then(onfulfilled, onrejected)
  }
}
/* eslint-enable no-unused-vars */
