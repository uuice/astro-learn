import { getCollection } from 'astro:content'
import { stripMarkdown } from '../utils/strip-markdown.js'

const MAX_BODY_LENGTH = 8000

export const prerender = true

export async function GET() {
  const posts = await getCollection('post', ({ data }) => data.published)
  const index = posts.map((p) => {
    const rawBody = 'body' in p && typeof (p as { body?: string }).body === 'string' ? (p as { body: string }).body : ''
    const plainText = stripMarkdown(rawBody).slice(0, MAX_BODY_LENGTH)
    return {
      id: p.id,
      title: p.data.title,
      url: p.data.url,
      excerpt: (p.data.excerpt || '').slice(0, 200),
      categories: p.data.categories ?? [],
      tags: p.data.tags ?? [],
      body: plainText,
    }
  })
  return new Response(JSON.stringify(index), {
    headers: { 'Content-Type': 'application/json' },
  })
}
