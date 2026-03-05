import type { APIRoute } from 'astro'
import { getCollection } from 'astro:content'

export const GET: APIRoute = async () => {
  const [posts, links, authors] = await Promise.all([
    getCollection('post', ({ data }) => data.published),
    getCollection('link'),
    getCollection('author'),
  ])
  return new Response(
    JSON.stringify({
      posts: posts.length,
      links: links.length,
      authors: authors.length,
    }),
    { headers: { 'Content-Type': 'application/json' } }
  )
}
