import type { APIRoute } from 'astro'
import { getCollection } from 'astro:content'
import { getDerivedFromPosts } from '../utils/derived-collections'

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export const GET: APIRoute = async () => {
  const [setting] = await getCollection('setting')
  const baseUrl = (setting?.data.siteSetting?.baseUrl ?? 'https://example.com').replace(/\/$/, '')

  const posts = await getCollection('post', ({ data }) => data.published)
  const pages = await getCollection('page', ({ data }) => data.published)
  const { categories, tags } = getDerivedFromPosts(posts)

  const today = new Date().toISOString().split('T')[0]
  const urls: string[] = []

  const loc = (path: string) => escapeXml(baseUrl + path)
  urls.push(`  <url><loc>${loc('/')}</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq><priority>1.0</priority></url>`)
  urls.push(`  <url><loc>${loc('/archives')}</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq><priority>0.9</priority></url>`)
  urls.push(`  <url><loc>${loc('/links')}</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>0.5</priority></url>`)
  urls.push(`  <url><loc>${loc('/about')}</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>`)

  for (const post of posts) {
    const lastmod = new Date(post.data.updated_timestamp ?? post.data.created_timestamp).toISOString().split('T')[0]
    urls.push(`  <url><loc>${loc(post.data.url)}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`)
  }

  for (const page of pages) {
    const lastmod = new Date(page.data.updated_timestamp ?? page.data.created_timestamp).toISOString().split('T')[0]
    urls.push(`  <url><loc>${loc(page.data.url)}</loc><lastmod>${lastmod}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>`)
  }

  for (const cat of categories) {
    urls.push(`  <url><loc>${loc(cat.url)}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.6</priority></url>`)
  }

  for (const tag of tags) {
    urls.push(`  <url><loc>${loc(tag.url)}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.5</priority></url>`)
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=UTF-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
