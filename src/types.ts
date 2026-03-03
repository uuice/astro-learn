// 文章基础接口
export interface ARTICLE {
  id: string
  title: string
  alias: string
  cover: string
  created_time: string
  date?: string
  updated_time: string
  updated?: string
  categories: Array<string>
  tags: Array<string>
  excerpt: string
  published: boolean
  content: string
  mdContent: string
  toc: string
  created_timestamp: number
  updated_timestamp: number
  url: string
  symbolsCount: number
  authorIds: Array<string>
  [key: string]: string | Array<string> | boolean | number | undefined
}

// 作者接口
export interface AUTHOR extends Omit<ARTICLE, 'authorId'> {
  isDefault: boolean
}

// 页面接口扩展了文章的所有属性
export interface PAGE extends ARTICLE {
  // 页面特有的属性可以在这里添加
}
export type LIST_PAGE_ITEM = Omit<PAGE, 'content' | 'mdContent' | 'toc'>

// 文章接口扩展了文章的所有属性
export interface POST extends ARTICLE {
  // 文章特有的属性可以在这里添加
}
export type LIST_POST_ITEM = Omit<POST, 'content' | 'mdContent' | 'toc'>

// 分类接口
export interface CATEGORY {
  id: string
  title: string
  description: string
  url: string
}

export type CATEGORY_WITH_POST_NUM = CATEGORY & {
  postNum: number
}

// 标签接口
export interface TAG {
  id: string
  title: string
  description: string
  url: string
}

export type TAG_WITH_POST_NUM = TAG & {
  postNum: number
}

// 文章-分类关联
export interface POST_CATEGORY {
  postId: string
  categoryId: string
  id: string
}

// 文章-标签关联
export interface POST_TAG {
  postId: string
  tagId: string
  id: string
}

// JSON 配置
export interface JSON_OBJ {
  [key: string]: unknown
}

// 归档类型
export type ARCHIVES_DATE_YEAR = { [date: string]: LIST_POST_ITEM[] }[]
export type ARCHIVES_DATE_YEAR_MONTH = { [date: string]: ARCHIVES_DATE_YEAR }[]

// 分页查询
export type POST_PAGE_QUERY = {
  pageIndex: number
  pageCount: number
  prevPageIndex: number
  nextPageIndex: number
  pageSize: number
  postList: Omit<PAGE, 'content' | 'mdContent' | 'toc'>[]
}
