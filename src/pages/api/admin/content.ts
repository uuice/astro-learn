import type { APIRoute } from 'astro'
import { getCollection } from 'astro:content'

export const prerender = false

export const GET: APIRoute = async ({ url }) => {
  const token = url.searchParams.get('token')
  const adminToken = import.meta.env.ADMIN_TOKEN || ''
  if (!token || !adminToken || token !== adminToken) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
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
