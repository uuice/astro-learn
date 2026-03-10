import { join } from 'node:path'
import { mkdirSync, existsSync } from 'node:fs'
import { JSONFilePreset } from 'lowdb/node'

export interface ShortLink {
  id: string
  slug: string
  url: string
  createdAt: number
}

interface ShortlinksData {
  shortlinks: ShortLink[]
}

const defaultData: ShortlinksData = { shortlinks: [] }

function getDbPath(): string {
  const dir = join(process.cwd(), 'data')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  return join(dir, 'shortlinks.json')
}

let dbPromise: Promise<Awaited<ReturnType<typeof JSONFilePreset<ShortlinksData>>>> | null = null

export async function getShortlinksDb() {
  if (!dbPromise) {
    dbPromise = JSONFilePreset<ShortlinksData>(getDbPath(), defaultData)
  }
  return dbPromise
}

export async function getAllShortlinks(): Promise<ShortLink[]> {
  const db = await getShortlinksDb()
  return [...db.data.shortlinks].sort((a, b) => b.createdAt - a.createdAt)
}

export async function getShortlinkBySlug(slug: string): Promise<ShortLink | undefined> {
  const db = await getShortlinksDb()
  const normalized = slug.toLowerCase().trim()
  return db.data.shortlinks.find((s) => s.slug.toLowerCase() === normalized)
}

export async function addShortlink(
  input: { slug: string; url: string } | { url: string }
): Promise<ShortLink> {
  const db = await getShortlinksDb()
  let slug: string
  if ('slug' in input && input.slug.trim()) {
    slug = input.slug.trim().toLowerCase().replace(/\s+/g, '-')
    const existing = db.data.shortlinks.find((s) => s.slug.toLowerCase() === slug)
    if (existing) throw new Error('Slug already exists')
  } else {
    slug = generateSlug()
    let attempts = 0
    while (db.data.shortlinks.some((s) => s.slug.toLowerCase() === slug) && attempts < 100) {
      slug = generateSlug()
      attempts++
    }
  }
  const id = `sl_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
  const url = input.url.trim()
  if (!url) throw new Error('URL is required')
  const validUrl = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`
  const newLink: ShortLink = {
    id,
    slug,
    url: validUrl,
    createdAt: Date.now(),
  }
  db.data.shortlinks.push(newLink)
  await db.write()
  return newLink
}

function generateSlug(length = 6): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789'
  let s = ''
  for (let i = 0; i < length; i++) {
    s += chars[Math.floor(Math.random() * chars.length)]
  }
  return s
}

export async function deleteShortlink(id: string): Promise<boolean> {
  const db = await getShortlinksDb()
  const idx = db.data.shortlinks.findIndex((s) => s.id === id)
  if (idx === -1) return false
  db.data.shortlinks.splice(idx, 1)
  await db.write()
  return true
}
