import type { APIRoute } from 'astro'
import { getCollection } from 'astro:content'

export const GET: APIRoute = async () => {
  const links = await getCollection('link')
  const list = links.map((l) => ({
    id: l.id,
    title: l.data.title,
    url: l.data.url,
    type: l.data.type ?? '',
  }))
  return new Response(JSON.stringify({ total: list.length, data: list }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
