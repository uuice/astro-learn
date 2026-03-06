import type { APIRoute } from 'astro'
import { getCollection } from 'astro:content'

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
  const siteName = setting?.data.siteSetting?.siteName ?? '博客'
  const siteDescription = setting?.data.siteSetting?.siteDescription ?? ''

  const posts = await getCollection('post', ({ data }) => data.published)
  const sorted = posts
    .sort((a, b) => b.data.created_timestamp - a.data.created_timestamp)
    .slice(0, 20)

  const items = sorted
    .map((post) => {
      const fullUrl = baseUrl + post.data.url
      const pubDate = new Date(post.data.created_timestamp).toUTCString()
      const desc = post.data.excerpt || post.data.title
      const categories = (post.data.categories ?? []).map((c) => `<category><![CDATA[${c}]]></category>`).join('')
      return `<item>
  <title><![CDATA[${post.data.title}]]></title>
  <link>${fullUrl}</link>
  <guid isPermaLink="true">${fullUrl}</guid>
  <description><![CDATA[${desc}]]></description>
  <content:encoded><![CDATA[${desc}]]></content:encoded>
  <pubDate>${pubDate}</pubDate>
  ${categories}
</item>`
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteName)}</title>
    <link>${baseUrl}</link>
    <description>${escapeXml(siteDescription)}</description>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/rss" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=UTF-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
