import type { APIRoute } from 'astro'
import { getCollection } from 'astro:content'

export const GET: APIRoute = async ({ url }) => {
  const limit = Math.min(Number(url.searchParams.get('limit')) || 20, 100)
  const posts = await getCollection('post', ({ data }) => data.published)
  const sorted = [...posts].sort((a, b) => (b.data.created_timestamp ?? 0) - (a.data.created_timestamp ?? 0))
  const list = sorted.slice(0, limit).map((p) => ({
    id: p.id,
    title: p.data.title,
    url: p.data.url,
    excerpt: (p.data.excerpt || '').slice(0, 200),
    categories: p.data.categories ?? [],
    tags: p.data.tags ?? [],
    created: p.data.created_timestamp,
  }))
  return new Response(JSON.stringify({ total: posts.length, data: list }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
