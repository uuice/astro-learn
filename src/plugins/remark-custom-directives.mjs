/**
 * Custom remark plugin: Admonitions (:::type / > [!TYPE]) and GitHub repo cards (::github{repo="owner/repo"}).
 * No external dependencies - uses only Node built-ins and the existing unified/remark stack.
 */

const ADMONITION_TYPES = ['note', 'tip', 'important', 'caution', 'warning']
const TITLE_MAP = { note: 'Note', tip: 'Tip', important: 'Important', caution: 'Caution', warning: 'Warning' }

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Get plain text from mdast node (break -> \n, text -> value). */
function nodeToText(node) {
  if (!node) return ''
  if (node.type === 'text') return node.value || ''
  if (node.type === 'break') return '\n'
  if (node.type === 'paragraph' || node.type === 'blockquote') {
    return (node.children || []).map(nodeToText).join('')
  }
  if (Array.isArray(node.children)) return node.children.map(nodeToText).join('')
  return ''
}

/** Convert inline mdast children to HTML string (basic support). */
function inlineToHtml(children) {
  if (!children || !children.length) return ''
  return children
    .map((n) => {
      if (n.type === 'text') return escapeHtml(n.value || '')
      if (n.type === 'emphasis') return `<em>${inlineToHtml(n.children || [])}</em>`
      if (n.type === 'strong') return `<strong>${inlineToHtml(n.children || [])}</strong>`
      if (n.type === 'inlineCode') return `<code>${escapeHtml(n.value || '')}</code>`
      if (n.type === 'link') return `<a href="${escapeHtml(n.url || '')}">${inlineToHtml(n.children || [])}</a>`
      return nodeToText(n)
    })
    .join('')
}

/** Serialize block mdast nodes to HTML. */
function blocksToHtml(nodes) {
  if (!nodes || !nodes.length) return ''
  return nodes
    .map((n) => {
      if (n.type === 'paragraph') {
        const html = inlineToHtml(n.children || [])
        return html ? `<p>${html}</p>` : ''
      }
      if (n.type === 'code') {
        return `<pre><code>${escapeHtml(n.value || '')}</code></pre>`
      }
      const text = nodeToText(n).trim()
      return text ? `<p>${escapeHtml(text)}</p>` : ''
    })
    .filter(Boolean)
    .join('')
}

/** Preprocess raw markdown: replace :::type\n...\n::: and ::github{...} with HTML before parsing. */
function preprocessDirectives(doc) {
  let out = doc
  // 1. :::type ... ::: blocks
  const typePat = ADMONITION_TYPES.join('|')
  out = out.replace(
    new RegExp(`^:::(${typePat})\\s*\\n([\\s\\S]*?)\\n:::\\s*$`, 'gm'),
    (_, type, content) => {
      const title = TITLE_MAP[type] || type
      const variant = type === 'note' ? '' : ` bdm-${type}`
      const inner = content
        .trim()
        .split(/\n\n+/)
        .map((p) => `<p>${escapeHtml(p.trim())}</p>`)
        .join('')
      return `<div class="admonition admonition-${type}${variant}"><span class="bdm-title">${title}</span>${inner || ''}</div>`
    }
  )
  return out
}

/** Parse paragraph that may contain :::type content ::: (single paragraph) or ::github{repo="..."} */
function parseParagraph(text) {
  const t = text.trim()
  // 1. :::type ... ::: (entire block in one paragraph; \n may become space in mdast)
  const admonitionMatch = t.match(
    new RegExp(`^:::(${ADMONITION_TYPES.join('|')})\\s+([\\s\\S]*?)\\s*:::\\s*$`)
  )
  if (admonitionMatch) {
    return { kind: 'admonition', type: admonitionMatch[1], content: admonitionMatch[2].trim() }
  }
  // 2. ::github{repo="owner/repo"}
  const ghMatch = t.match(/^::github\{repo=["\u201C\u201D]?([^"\u201C\u201D]+)["\u201C\u201D]?\}$/)
  if (ghMatch) {
    return { kind: 'github', repo: ghMatch[1].trim().replace(/^["\u201C\u201D]+|["\u201C\u201D]+$/g, '') }
  }
  // 3. Single paragraph block: ::: github{repo="..."} ::: (optional whitespace between parts)
  const ghBlockInOneMatch = t.match(/^:::\s*github\s*\{\s*repo\s*=\s*["\u201C\u201D]?([^"\u201C\u201D]+)["\u201C\u201D]?\s*\}\s*:::\s*$/s)
  if (ghBlockInOneMatch) {
    return { kind: 'github', repo: ghBlockInOneMatch[1].trim().replace(/^["\u201C\u201D]+|["\u201C\u201D]+$/g, '') }
  }
  return null
}

export default function remarkCustomDirectives() {
  return async function transformer(tree, file) {
    const children = tree.children || []
    const newChildren = []
    let i = 0

    while (i < children.length) {
      const node = children[i]

      // 1. Handle paragraph: may contain :::type\n...\n::: or ::github{repo="..."}
      // Skip if paragraph is only inline code (syntax example like `::github{repo="owner/repo"}`)
      if (node.type === 'paragraph' && node.children) {
        const onlyInlineCode = node.children.length === 1 && node.children[0].type === 'inlineCode'
        if (onlyInlineCode) {
          newChildren.push(node)
          i++
          continue
        }
        const text = nodeToText(node).trim()
        const parsed = parseParagraph(text)
        if (parsed) {
          if (parsed.kind === 'admonition') {
            const { type, content } = parsed
            const title = TITLE_MAP[type] || type
            const variant = type === 'note' ? '' : ` bdm-${type}`
            const inner = content
              .split(/\n\n+/)
              .map((p) => `<p>${escapeHtml(p.trim())}</p>`)
              .join('')
            newChildren.push({
              type: 'html',
              value: `<div class="admonition admonition-${type}${variant}"><span class="bdm-title">${title}</span>${inner || ''}</div>`,
            })
          } else if (parsed.kind === 'github') {
            let html
            try {
              html = await fetchGitHubCard(parsed.repo)
            } catch {
              html = fallbackGitHubCard(parsed.repo)
            }
            newChildren.push({ type: 'html', value: html })
          }
          i++
          continue
        }

        // 2. Handle ::: as opener with github on next line (same block form as Admonitions)
        if (text === ':::') {
          let j = i + 1
          let repo = null
          while (j < children.length) {
            const n = children[j]
            if (n.type !== 'paragraph') break
            const line = nodeToText(n).trim()
            if (line === ':::') break
            if (!line) { j++; continue }
            const ghBlockMatch = line.match(/^github\s*\{\s*repo\s*=\s*["\u201C\u201D]?([^"\u201C\u201D]+)["\u201C\u201D]?\s*\}$/)
            if (ghBlockMatch) {
              repo = ghBlockMatch[1].trim().replace(/^["\u201C\u201D]+|["\u201C\u201D]+$/g, '')
              j++
              break
            }
            break
          }
          if (repo !== null) {
            while (j < children.length) {
              const n = children[j]
              if (n.type === 'paragraph' && nodeToText(n).trim() === ':::') {
                j++
                break
              }
              j++
            }
            let html
            try {
              html = await fetchGitHubCard(repo)
            } catch {
              html = fallbackGitHubCard(repo)
            }
            newChildren.push({ type: 'html', value: html })
            i = j
            continue
          }
        }

        // 3. Handle :::type as separate opener (multi-paragraph block)
        const directiveMatch = text.match(new RegExp(`^:::(${ADMONITION_TYPES.join('|')})$`))
        if (directiveMatch) {
          const type = directiveMatch[1]
          const contentNodes = []
          i++
          while (i < children.length) {
            const n = children[i]
            if (n.type === 'paragraph' && nodeToText(n).trim() === ':::') {
              i++
              break
            }
            contentNodes.push(n)
            i++
          }
          const title = TITLE_MAP[type] || type
          const variant = type === 'note' ? '' : ` bdm-${type}`
          const inner = blocksToHtml(contentNodes)
          newChildren.push({
            type: 'html',
            value: `<div class="admonition admonition-${type}${variant}"><span class="bdm-title">${title}</span>${inner || ''}</div>`,
          })
          continue
        }
      }

      // 4. Handle > [!TYPE] blockquote (GitHub-style admonition)
      if (node.type === 'blockquote' && node.children && node.children.length) {
        const first = node.children[0]
        const firstText = nodeToText(first).trim()
        const blockquoteMatch = firstText.match(/^\[!(NOTE|TIP|IMPORTANT|CAUTION|WARNING)\]$/i)
        if (blockquoteMatch) {
          const type = blockquoteMatch[1].toLowerCase()
          const contentNodes = node.children.slice(1)
          const title = TITLE_MAP[type] || type
          const variant = type === 'note' ? '' : ` bdm-${type}`
          const inner = blocksToHtml(contentNodes)
          newChildren.push({
            type: 'html',
            value: `<div class="admonition admonition-${type}${variant}"><span class="bdm-title">${title}</span>${inner || ''}</div>`,
          })
          i++
          continue
        }
      }

      newChildren.push(node)
      i++
    }

    tree.children = newChildren
  }
}

async function fetchGitHubCard(repo) {
  const [owner, name] = repo.split('/')
  if (!owner || !name) return fallbackGitHubCard(repo)

  const res = await globalThis.fetch(`https://api.github.com/repos/${owner}/${name}`, {
    headers: { Accept: 'application/vnd.github.v3+json' },
  })
  const data = await res.json()

  if (!res.ok || data.message) {
    return fallbackGitHubCard(repo)
  }

  const url = data.html_url || `https://github.com/${repo}`
  const desc = escapeHtml((data.description || '').slice(0, 200))
  const avatar = data.owner?.avatar_url || ''
  const stars = data.stargazers_count ?? 0
  const forks = data.forks_count ?? 0
  const lang = data.language || ''

  return `<a href="${escapeHtml(url)}" class="card-github no-styling" target="_blank" rel="noopener noreferrer">
  <div class="gc-titlebar">
    <div class="gc-titlebar-left">
      <div class="gc-owner">
        <img class="gc-avatar" src="${escapeHtml(avatar)}" alt="" width="20" height="20" loading="lazy" />
        <span class="gc-divider">/</span>
        <span class="gc-repo">${escapeHtml(name)}</span>
      </div>
    </div>
  </div>
  ${desc ? `<div class="gc-description">${desc}</div>` : ''}
  <div class="gc-infobar">${stars} stars · ${forks} forks${lang ? ` · ${escapeHtml(lang)}` : ''}</div>
</a>`
}

function fallbackGitHubCard(repo) {
  const url = `https://github.com/${repo}`
  const [owner, name] = repo.split('/')
  return `<a href="${escapeHtml(url)}" class="card-github no-styling fetch-error" target="_blank" rel="noopener noreferrer">
  <div class="gc-titlebar">
    <div class="gc-titlebar-left">
      <div class="gc-owner">
        <span class="gc-divider">/</span>
        <span class="gc-repo">${escapeHtml(name || repo)}</span>
      </div>
    </div>
  </div>
  <div class="gc-description">Unable to load repo info. Click to open.</div>
  <div class="gc-infobar">github.com/${escapeHtml(repo)}</div>
</a>`
}
