/**
 * Rehype plugin: transform directive paragraphs in HTML to Admonitions and GitHub cards.
 * Fetches GitHub repo data and renders full card-github as HAST so it always renders.
 */

const ADMONITION_TYPES = ['note', 'tip', 'important', 'caution', 'warning']
const TITLE_MAP = { note: 'Note', tip: 'Tip', important: 'Important', caution: 'Caution', warning: 'Warning' }

function getTextContent(node) {
  if (!node) return ''
  if (node.type === 'text') return node.value || ''
  if (node.children) return node.children.map(getTextContent).join('')
  return ''
}

function admonitionToHtml(type, content) {
  const title = TITLE_MAP[type] || type
  const variant = type === 'note' ? '' : ` bdm-${type}`
  const paragraphs = content.trim().split(/\n\n+/).filter(Boolean)
  const children = [
    { type: 'element', tagName: 'span', properties: { className: ['bdm-title'] }, children: [{ type: 'text', value: title }] },
    ...paragraphs.map((p) => ({ type: 'element', tagName: 'p', properties: {}, children: [{ type: 'text', value: p.trim() }] }))
  ]
  return { type: 'element', tagName: 'div', properties: { className: ['admonition', `admonition-${type}${variant}`.trim()] }, children }
}

async function fetchGitHubRepo(repo) {
  const [owner, name] = repo.split('/')
  if (!owner || !name) return null
  const res = await globalThis.fetch(`https://api.github.com/repos/${owner}/${name}`, {
    headers: { Accept: 'application/vnd.github.v3+json' },
  })
  const data = await res.json()
  if (!res.ok || data.message) return null
  return {
    url: data.html_url || `https://github.com/${repo}`,
    name: name,
    description: (data.description || '').slice(0, 200),
    avatar: data.owner?.avatar_url || '',
    stars: data.stargazers_count ?? 0,
    forks: data.forks_count ?? 0,
    lang: data.language || '',
  }
}

/** Build full card-github as HAST (same structure as remark's fetchGitHubCard output). */
function createGitHubCardElement(repo, data) {
  const url = data ? data.url : `https://github.com/${repo}`
  const name = data ? data.name : (repo.split('/')[1] || repo)
  const className = ['card-github', 'no-styling']
  if (!data) className.push('fetch-error')

  const children = [
    {
      type: 'element',
      tagName: 'div',
      properties: { className: ['gc-titlebar'] },
      children: [
        {
          type: 'element',
          tagName: 'div',
          properties: { className: ['gc-titlebar-left'] },
          children: [
            {
              type: 'element',
              tagName: 'div',
              properties: { className: ['gc-owner'] },
              children: [
                ...(data?.avatar
                  ? [{ type: 'element', tagName: 'img', properties: { className: ['gc-avatar'], src: data.avatar, alt: '', width: 20, height: 20, loading: 'lazy' }, children: [] }]
                  : []),
                { type: 'element', tagName: 'span', properties: { className: ['gc-divider'] }, children: [{ type: 'text', value: '/' }] },
                { type: 'element', tagName: 'span', properties: { className: ['gc-repo'] }, children: [{ type: 'text', value: name }] },
              ],
            },
          ],
        },
      ],
    },
    ...((data?.description || !data)
      ? [{ type: 'element', tagName: 'div', properties: { className: ['gc-description'] }, children: [{ type: 'text', value: data?.description || 'Unable to load repo info. Click to open.' }] }]
      : []),
    {
      type: 'element',
      tagName: 'div',
      properties: { className: ['gc-infobar'] },
      children: [{ type: 'text', value: data ? `${data.stars} stars · ${data.forks} forks${data.lang ? ` · ${data.lang}` : ''}` : `github.com/${repo}` }],
    },
  ]

  return {
    type: 'element',
    tagName: 'a',
    properties: { href: url, className, target: '_blank', rel: 'noopener noreferrer' },
    children,
  }
}

function parseDirective(text) {
  const t = (text || '').trim()
  const types = ADMONITION_TYPES.join('|')
  const admonitionMatch = t.match(new RegExp(`^:::(${types})\\s+([\\s\\S]*?)\\s*:::\\s*$`))
  if (admonitionMatch) return { kind: 'admonition', type: admonitionMatch[1], content: admonitionMatch[2].trim() }
  // Match straight " and curly " " quotes; normalize repo
  const norm = (s) => (s || '').trim().replace(/^["\u201C\u201D]+|["\u201C\u201D]+$/g, '')
  const ghMatch = t.match(/^::github\{repo=[""\u201C\u201D]?([^""\u201C\u201D]+)[""\u201C\u201D]?\}$/)
  if (ghMatch) return { kind: 'github', repo: norm(ghMatch[1]) }
  const ghBlockMatch = t.match(/^github\s*\{\s*repo\s*=\s*[""\u201C\u201D]?([^""\u201C\u201D]+)[""\u201C\u201D]?\s*\}$/)
  if (ghBlockMatch) return { kind: 'github', repo: norm(ghBlockMatch[1]) }
  const ghBlockInOneMatch = t.match(/^:::\s*github\s*\{\s*repo\s*=\s*[""\u201C\u201D]?([^""\u201C\u201D]+)[""\u201C\u201D]?\s*\}\s*:::\s*$/s)
  if (ghBlockInOneMatch) return { kind: 'github', repo: norm(ghBlockInOneMatch[1]) }
  return null
}

export default function rehypeCustomDirectives() {
  return async (tree) => {
    if (!tree.children) return
    const newChildren = []
    for (let i = 0; i < tree.children.length; i++) {
      const node = tree.children[i]
      if (node.type === 'element' && node.tagName === 'p' && node.children) {
        const text = getTextContent(node).trim()
        // Block form: ::: then (optional empty <p>) github{repo="..."} then (optional empty <p>) :::
        if (text === ':::') {
          let j = i + 1
          let parsed = null
          while (j < tree.children.length) {
            const next = tree.children[j]
            if (next.type !== 'element' || next.tagName !== 'p') break
            const nextText = getTextContent(next).trim()
            if (nextText === ':::') break
            if (!nextText) { j++; continue }
            parsed = parseDirective(nextText)
            if (parsed?.kind === 'github') { j++; break }
            break
          }
          if (parsed?.kind === 'github') {
            while (j < tree.children.length) {
              const close = tree.children[j]
              if (close.type === 'element' && close.tagName === 'p' && getTextContent(close).trim() === ':::') {
                j++
                break
              }
              j++
            }
            const data = await fetchGitHubRepo(parsed.repo).catch(() => null)
            newChildren.push(createGitHubCardElement(parsed.repo, data))
            i = j - 1
            continue
          }
        }
        const parsed = parseDirective(text)
        if (parsed) {
          if (parsed.kind === 'admonition') {
            newChildren.push(admonitionToHtml(parsed.type, parsed.content))
          } else if (parsed.kind === 'github') {
            const data = await fetchGitHubRepo(parsed.repo).catch(() => null)
            newChildren.push(createGitHubCardElement(parsed.repo, data))
          }
          continue
        }
      }
      newChildren.push(node)
    }
    tree.children = newChildren
  }
}
