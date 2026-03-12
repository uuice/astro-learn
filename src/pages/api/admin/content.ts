import type { APIRoute } from 'astro'
import { getCollection } from 'astro:content'
import { checkAdminSession, unauthorizedResponse } from '../../../lib/admin-auth'

export const prerender = false

export const GET: APIRoute = async ({ session }) => {
  if (!(await checkAdminSession(session))) {
    return unauthorizedResponse()
  }
  const [posts, pages, authors] = await Promise.all([
    getCollection('post'),
    getCollection('page'),
    getCollection('author'),
  ])
  const data = {
    posts: posts.map((e) => ({ id: e.id, data: e.data })),
    pages: pages.map((e) => ({ id: e.id, data: e.data })),
    authors: authors.map((e) => ({ id: e.id, data: e.data })),
  }
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  })
}
