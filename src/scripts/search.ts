import { Index } from 'flexsearch'

export type SearchDoc = {
  id: string
  title: string
  url: string
  excerpt: string
  body: string
  categories: string[]
  tags: string[]
}

function searchableText(doc: SearchDoc): string {
  return [
    doc.title,
    doc.excerpt,
    doc.body,
    (doc.categories || []).join(' '),
    (doc.tags || []).join(' '),
  ].filter(Boolean).join(' ')
}

function cjkEncode(s: string): string[] {
  const out: string[] = []
  for (const c of s) {
    if (/\s/.test(c)) continue
    out.push(c)
  }
  return out.length ? out : [s]
}

export function createSearchIndex(docs: SearchDoc[]): Index {
  const index = new Index({
    encode: cjkEncode,
    tokenize: 'forward',
    resolution: 9,
    cache: 100,
  })
  for (const doc of docs) {
    index.add(doc.id, searchableText(doc))
  }
  return index
}

export function search(index: Index, docs: SearchDoc[], query: string, limit: number): SearchDoc[] {
  const q = query.trim()
  if (!q) return []
  const raw = index.search(q, { limit })
  const ids = Array.isArray(raw) ? raw : []
  const docMap = new Map(docs.map((d) => [d.id, d]))
  return ids.map((id) => docMap.get(String(id))).filter(Boolean) as SearchDoc[]
}
