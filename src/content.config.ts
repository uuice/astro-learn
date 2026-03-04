import { defineCollection } from 'astro:content'
import { glob, file } from 'astro/loaders'
import { z } from 'astro/zod'
import { titleToUrl, generatePostId, generatePageId, generateAuthorId } from './utils/index.js'

type FrontmatterBase = { title: string; alias?: string }

const baseSchema = {
  id: z.string(),
  title: z.string(),
  alias: z.union([z.string(), z.null()]).optional().default('').transform((v) => v ?? ''),
  cover: z.union([z.string(), z.null()]).optional().default('').transform((v) => v ?? ''),
  created_time: z.union([z.string(), z.date()]),
  updated_time: z.union([z.string(), z.date()]),
  categories: z.union([z.array(z.string()), z.null()]).default([]).transform((v) => v ?? []),
  tags: z.union([z.array(z.string()), z.null()]).default([]).transform((v) => v ?? []),
  excerpt: z.union([z.string(), z.null()]).optional().default('').transform((v) => v ?? ''),
  published: z.boolean().default(true),
}

function withComputed<T extends z.ZodRawShape>(shape: T, urlPrefix: string) {
  return z.object({ ...shape, symbolsCount: z.number().optional(), url: z.string().optional() }).transform((data) => {
    const slug = data.url || titleToUrl(data.alias || data.title)
    return {
      ...data,
      created_timestamp: new Date(data.created_time || Date.now()).getTime(),
      updated_timestamp: new Date(data.updated_time || Date.now()).getTime(),
      url: `${urlPrefix}/${slug}`,
      symbolsCount: data.symbolsCount ?? 0,
    }
  })
}

const post = defineCollection({
  loader: glob({
    pattern: '**/*.{md,mdx}',
    base: './src/content/blog',
    generateId: ({ data }) => { const d = data as FrontmatterBase; return generatePostId(d.title, d.alias ?? '') },
  }),
  schema: withComputed(baseSchema, '/archives'),
})

const page = defineCollection({
  loader: glob({
    pattern: '**/*.{md,mdx}',
    base: './src/content/page',
    generateId: ({ data }) => { const d = data as FrontmatterBase; return generatePageId(d.title, d.alias ?? '') },
  }),
  schema: withComputed(baseSchema, '/pages'),
})

const author = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './src/content/author',
    generateId: ({ data }) => generateAuthorId((data as FrontmatterBase).title),
  }),
  schema: z.object({
    ...baseSchema,
    isDefault: z.boolean().optional().default(false),
    symbolsCount: z.number().optional(),
    url: z.string().optional(),
  }).transform((data) => ({
    ...data,
    created_timestamp: new Date(data.created_time || Date.now()).getTime(),
    updated_timestamp: new Date(data.updated_time || Date.now()).getTime(),
    url: data.url || `/authors/${titleToUrl(data.alias || data.title)}`,
    symbolsCount: data.symbolsCount ?? 0,
  })),
})

const linkItem = z.object({
  id: z.string(),
  title: z.string(),
  icon: z.string().optional().default(''),
  url: z.string(),
  type: z.string().optional(),
})

const link = defineCollection({
  loader: file('src/content/json/link.json', {
    parser: (text) => {
      const arr = JSON.parse(text) as { title: string; icon?: string; url: string; type?: string }[]
      return Object.fromEntries(arr.map((item, i) => [item.title || String(i), { id: item.title || String(i), ...item }]))
    },
  }),
  schema: linkItem,
})

const menuItem = z.object({
  id: z.string(),
  title: z.string(),
  icon: z.string().optional().default(''),
  url: z.string(),
  target: z.string().optional().default('_self'),
})

const menu = defineCollection({
  loader: file('src/content/json/menu.json', {
    parser: (text) => {
      const arr = JSON.parse(text) as { title: string; icon?: string; url: string; target?: string }[]
      return Object.fromEntries(arr.map((item, i) => [item.title || String(i), { id: item.title || String(i), ...item }]))
    },
  }),
  schema: menuItem,
})

const websiteItem = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional().default(''),
  url: z.string(),
  icon: z.string().optional().default(''),
  tags: z.array(z.string()).optional().default([]),
})

const navCategory = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional().default(''),
  websites: z.array(websiteItem),
})

const navigationWebsiteData = defineCollection({
  loader: file('src/content/json/navigationWebsiteData.json', {
    parser: (text) => ({ default: JSON.parse(text) }),
  }),
  schema: z.object({
    categories: z.array(navCategory),
  }),
})

const storageSetting = z.object({
  storageType: z.string(),
  accessKey: z.string().optional().default(''),
  secretKey: z.string().optional().default(''),
  bucket: z.string().optional().default(''),
  region: z.string().optional().default(''),
  domain: z.string().optional().default(''),
  uploadPath: z.string().optional().default('uploads'),
})

const recordSettings = z.object({
  icpNumber: z.string().optional().default(''),
  icpLink: z.string().optional().default(''),
  policeNumber: z.string().optional().default(''),
  policeLink: z.string().optional().default(''),
  recordText: z.string().optional().default(''),
  showRecord: z.boolean().optional().default(true),
})

const siteSetting = z.object({
  baseUrl: z.string(),
  siteName: z.string(),
  siteDescription: z.string().optional().default(''),
  siteKeywords: z.string().optional().default(''),
  siteLogo: z.string().optional().default(''),
  siteFavicon: z.string().optional().default(''),
  siteFooter: z.string().optional().default(''),
  allowRegistration: z.boolean().optional().default(true),
  allowComment: z.boolean().optional().default(true),
  commentAudit: z.boolean().optional().default(true),
  defaultLanguage: z.string().optional().default('zh-CN'),
  timezone: z.string().optional().default('Asia/Shanghai'),
  dateFormat: z.string().optional().default('YYYY-MM-DD'),
  timeFormat: z.string().optional().default('HH:mm:ss'),
})

const setting = defineCollection({
  loader: file('src/content/json/setting.json', {
    parser: (text) => ({ default: JSON.parse(text) }),
  }),
  schema: z.object({
    storageSetting,
    recordSettings,
    siteSetting,
  }),
})

export const collections = { post, page, author, link, menu, navigationWebsiteData, setting }
