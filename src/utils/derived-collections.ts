import type { CATEGORY, TAG, POST_CATEGORY, POST_TAG } from '../types'
import { titleToUrl, generateNamespaceUUID, generateCategoryId, generateTagId } from './index.js'

export type PostEntry = { id: string; data: { categories?: string[]; tags?: string[] } }

export type DerivedFromPosts = {
  categories: CATEGORY[]
  tags: TAG[]
  postCategories: POST_CATEGORY[]
  postTags: POST_TAG[]
}

let cached: { posts: PostEntry[]; result: DerivedFromPosts } | null = null

export function getDerivedFromPosts(posts: PostEntry[]): DerivedFromPosts {
  if (cached && cached.posts === posts) return cached.result
  const categoryMap = new Map<string, CATEGORY>()
  const tagMap = new Map<string, TAG>()
  const postCategories: POST_CATEGORY[] = []
  const postTags: POST_TAG[] = []
  for (const post of posts) {
    for (const t of post.data.categories ?? []) {
      if (t && !categoryMap.has(t)) {
        const categoryId = generateCategoryId(t)
        categoryMap.set(t, { id: categoryId, title: t, description: '', url: `/categories/${titleToUrl(t)}` })
      }
      if (t) {
        const categoryId = generateCategoryId(t)
        postCategories.push({
          id: generateNamespaceUUID(`post_category:${post.id}:${categoryId}`),
          postId: post.id,
          categoryId,
        })
      }
    }
    for (const t of post.data.tags ?? []) {
      if (t && !tagMap.has(t)) {
        const tagId = generateTagId(t)
        tagMap.set(t, { id: tagId, title: t, description: '', url: `/tags/${titleToUrl(t)}` })
      }
      if (t) {
        const tagId = generateTagId(t)
        postTags.push({
          id: generateNamespaceUUID(`post_tag:${post.id}:${tagId}`),
          postId: post.id,
          tagId,
        })
      }
    }
  }
  const result: DerivedFromPosts = {
    categories: Array.from(categoryMap.values()),
    tags: Array.from(tagMap.values()),
    postCategories,
    postTags,
  }
  cached = { posts, result }
  return result
}

export function getCategoriesFromPosts(posts: PostEntry[]): CATEGORY[] {
  return getDerivedFromPosts(posts).categories
}

export function getTagsFromPosts(posts: PostEntry[]): TAG[] {
  return getDerivedFromPosts(posts).tags
}

export function getPostCategoriesFromPosts(posts: PostEntry[]): POST_CATEGORY[] {
  return getDerivedFromPosts(posts).postCategories
}

export function getPostTagsFromPosts(posts: PostEntry[]): POST_TAG[] {
  return getDerivedFromPosts(posts).postTags
}
