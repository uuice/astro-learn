/**
 * Rehype plugin: custom directives - Admonitions, GitHub cards, Details, Tabs, Steps, Quote.
 */

const ADMONITION_TYPES = ['note', 'tip', 'important', 'caution', 'warning']
const TITLE_MAP = { note: 'Note', tip: 'Tip', important: 'Important', caution: 'Caution', warning: 'Warning' }

function getTextContent(node) {
  if (!node) return ''
  if (node.type === 'text') return node.value || ''
  if (node.children) return node.children.map(getTextContent).join('')
  return ''
}

/** Collect sibling nodes until <p>:::</p>, return { nodes, endIndex } (endIndex points past the closing :::). */
function collectUntilClosing(children, startIdx) {
  const nodes = []
  let j = startIdx
  while (j < children.length) {
    const n = children[j]
    if (n.type === 'element' && n.tagName === 'p' && /^:::\s*$/.test(getTextContent(n).trim())) {
      j++
      break
    }
    nodes.push(n)
    j++
  }
  return { nodes, endIndex: j }
}

/** Build admonition HAST from type and string content (paragraphs split by \n\n). */
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

/** Build admonition from type and list of content nodes (clone and use as body). */
function admonitionFromNodes(type, contentNodes) {
  const title = TITLE_MAP[type] || type
  const variant = type === 'note' ? '' : ` bdm-${type}`
  const children = [
    { type: 'element', tagName: 'span', properties: { className: ['bdm-title'] }, children: [{ type: 'text', value: title }] },
    ...(contentNodes || [])
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

/** Extract attr="val" or attr=val from {attr="val"} (supports straight/curly quotes and unquoted) */
function parseAttrs(str) {
  const attrs = {}
  if (!str) return attrs
  const re = /(\w+)\s*=\s*(?:"([^"]*)"|'([^']*)'|[\u201C\u201D"]([^\u201C\u201D"]*)[\u201C\u201D"]|([^}\s,]+))/g
  let m
  while ((m = re.exec(str)) !== null) {
    const val = (m[2] ?? m[3] ?? m[4] ?? m[5] ?? '').trim()
    if (val) attrs[m[1]] = val
  }
  return attrs
}

/** Parse block opener line: :::details, :::details{summary="x"}, :::steps, :::quote{author="x"}, :::tabs, :::tab{name="x"} */
function parseBlockOpener(text) {
  const t = (text || '').trim()
  const m = t.match(/^:::(\w+)(?:\{([^}]*)\})?(?:\s+(.+))?$/)
  if (!m) return null
  const [, name, attrStr, rest] = m
  const attrs = parseAttrs(attrStr)
  if (name === 'details') return { kind: 'details', summary: attrs.summary || rest?.trim() || '点击展开' }
  if (name === 'steps') return { kind: 'steps' }
  if (name === 'quote') return { kind: 'quote', author: attrs.author, source: attrs.source }
  if (name === 'tabs') return { kind: 'tabs' }
  if (name === 'tab') return { kind: 'tab', name: attrs.name || rest?.trim() || 'Tab' }
  return null
}

/** Parse single-paragraph block: opener + content + ::: in one string (newlines may be \n or space) */
function parseBlockInOne(text) {
  const t = (text || '').trim()
  // details: :::details 标题\ncontent\n:::
  const detailsMatch = t.match(/^:::details(?:\{([^}]*)\})?(?:\s+([^\n]*))?[\s\n]+([\s\S]*?)[\s\n]*:::\s*$/)
  if (detailsMatch) {
    const attrs = parseAttrs(detailsMatch[1])
    const summary = attrs.summary || detailsMatch[2]?.trim() || '点击展开'
    const content = detailsMatch[3].trim()
    return { kind: 'details', summary, content }
  }
  // steps: :::steps\nline1\nline2\n:::
  const stepsMatch = t.match(/^:::steps[\s\n]+([\s\S]*?)[\s\n]*:::\s*$/)
  if (stepsMatch) {
    const lines = stepsMatch[1].split(/\n/).map((s) => s.trim()).filter(Boolean)
    return { kind: 'steps', lines }
  }
  // quote: :::quote{author="x" source="y"}\ncontent\n:::
  const quoteMatch = t.match(/^:::quote(?:\{([^}]*)\})?[\s\n]+([\s\S]*?)[\s\n]*:::\s*$/)
  if (quoteMatch) {
    const attrs = parseAttrs(quoteMatch[1])
    return { kind: 'quote', author: attrs.author, source: attrs.source, content: quoteMatch[2].trim() }
  }
  return null
}

function parseDirective(text) {
  const t = (text || '').trim()
  const types = ADMONITION_TYPES.join('|')
  const admonitionMatch = t.match(new RegExp(`^:::(${types})\\s+([\\s\\S]*?)\\s*:::\\s*$`))
  if (admonitionMatch) return { kind: 'admonition', type: admonitionMatch[1], content: admonitionMatch[2].trim() }
  const norm = (s) => (s || '').trim().replace(/^["\u201C\u201D]+|["\u201C\u201D]+$/g, '')
  const ghMatch = t.match(/^::github\{repo=["\u201C\u201D]?([^"\u201C\u201D]+)["\u201C\u201D]?\}$/)
  if (ghMatch) return { kind: 'github', repo: norm(ghMatch[1]) }
  const ghBlockMatch = t.match(/^github\s*\{\s*repo\s*=\s*["\u201C\u201D]?([^"\u201C\u201D]+)["\u201C\u201D]?\s*\}$/)
  if (ghBlockMatch) return { kind: 'github', repo: norm(ghBlockMatch[1]) }
  const ghBlockInOneMatch = t.match(/^:::\s*github\s*\{\s*repo\s*=\s*["\u201C\u201D]?([^"\u201C\u201D]+)["\u201C\u201D]?\s*\}\s*:::\s*$/s)
  if (ghBlockInOneMatch) return { kind: 'github', repo: norm(ghBlockInOneMatch[1]) }
  const blockInOne = parseBlockInOne(t)
  if (blockInOne) return blockInOne
  return null
}

/** Build <details> with <summary> and content */
function createDetailsElement(summary, contentNodes) {
  return {
    type: 'element',
    tagName: 'details',
    properties: { className: ['directive-details'] },
    children: [
      { type: 'element', tagName: 'summary', properties: {}, children: [{ type: 'text', value: summary }] },
      { type: 'element', tagName: 'div', properties: { className: ['directive-details-content'] }, children: contentNodes || [] },
    ],
  }
}

/** Build <ol class="directive-steps"> from content nodes; each paragraph = one step */
function createStepsElement(contentNodes) {
  const steps = []
  for (const n of contentNodes || []) {
    const text = getTextContent(n).trim()
    if (!text) continue
    steps.push({ type: 'element', tagName: 'li', properties: {}, children: [{ type: 'text', value: text }] })
  }
  return {
    type: 'element',
    tagName: 'ol',
    properties: { className: ['directive-steps'] },
    children: steps,
  }
}

/** Build blockquote with optional footer (author, source) */
function createQuoteElement(contentNodes, author, source) {
  const footerParts = []
  if (author) footerParts.push(author)
  if (source) footerParts.push(source)
  const footerText = footerParts.length ? `— ${footerParts.join(', ')}` : ''
  const children = [...(contentNodes || [])]
  if (footerText) {
    children.push({
      type: 'element',
      tagName: 'footer',
      properties: { className: ['directive-quote-footer'] },
      children: [{ type: 'text', value: footerText }],
    })
  }
  return {
    type: 'element',
    tagName: 'blockquote',
    properties: { className: ['directive-quote'] },
    children,
  }
}

/** Build tabs: flat [input, label, panel, input, label, panel, ...] for pure-CSS switching */
function createTabsElement(tabItems) {
  const name = `tabs-${Math.random().toString(36).slice(2, 10)}`
  const flat = []
  tabItems.forEach((tab, idx) => {
    flat.push({
      type: 'element',
      tagName: 'input',
      properties: { type: 'radio', name, id: `${name}-${idx}`, className: ['directive-tabs-input'], checked: idx === 0 },
      children: [],
    })
    flat.push({
      type: 'element',
      tagName: 'label',
      properties: { className: ['directive-tabs-label'], htmlFor: `${name}-${idx}` },
      children: [{ type: 'text', value: tab.name }],
    })
    flat.push({
      type: 'element',
      tagName: 'div',
      properties: { className: ['directive-tabs-panel'] },
      children: tab.contentNodes || [],
    })
  })
  return {
    type: 'element',
    tagName: 'div',
    properties: { className: ['directive-tabs'] },
    children: flat,
  }
}

/** Process a children array (mutates in place via collectUntilClosing using same ref) */
async function processChildren(children) {
  if (!children || !Array.isArray(children)) return
  const newChildren = []
  for (let i = 0; i < children.length; i++) {
    const node = children[i]

      // 1. Blockquote > [!TYPE] (GitHub-style admonition)
      if (node.type === 'element' && node.tagName === 'blockquote' && node.children?.length) {
        const firstText = getTextContent(node.children[0]).trim()
        const blockquoteMatch = firstText.match(/^\[!(NOTE|TIP|IMPORTANT|CAUTION|WARNING)\]$/i)
        if (blockquoteMatch) {
          const type = blockquoteMatch[1].toLowerCase()
          const contentNodes = node.children.slice(1)
          newChildren.push(admonitionFromNodes(type, contentNodes))
          continue
        }
      }

      // 2. Paragraph: single or start of block directive
      if (node.type === 'element' && node.tagName === 'p' && node.children) {
        const text = getTextContent(node).trim()

        // 2a. Multi-paragraph admonition: <p>:::note</p> ... <p>:::</p>
        const directiveMatch = text.match(new RegExp(`^:::(${ADMONITION_TYPES.join('|')})$`))
        if (directiveMatch) {
          const type = directiveMatch[1]
          const contentNodes = collectUntilClosing(children, i + 1)
          newChildren.push(admonitionFromNodes(type, contentNodes.nodes))
          i = contentNodes.endIndex - 1
          continue
        }

        // 2a2. Block openers: details, steps, quote
        const blockOpener = parseBlockOpener(text)
        if (blockOpener && ['details', 'steps', 'quote'].includes(blockOpener.kind)) {
          const { nodes, endIndex } = collectUntilClosing(children, i + 1)
          if (blockOpener.kind === 'details') {
            newChildren.push(createDetailsElement(blockOpener.summary, nodes))
          } else if (blockOpener.kind === 'steps') {
            newChildren.push(createStepsElement(nodes))
          } else if (blockOpener.kind === 'quote') {
            newChildren.push(createQuoteElement(nodes, blockOpener.author, blockOpener.source))
          }
          i = endIndex - 1
          continue
        }

        // 2a3. Tabs: :::tabs then :::tab{name="X"} content (p or pre etc) ::: ... until :::
        if (/^:::tabs\s*$/.test(text)) {
          const tabItems = []
          let j = i + 1
          while (j < children.length) {
            const n = children[j]
            // Only :::tab{name="X"} and ::: are <p>; content (pre, etc.) is collected by collectUntilClosing
            if (n.type !== 'element' || n.tagName !== 'p') break
            const line = getTextContent(n).trim()
            if (/^:::\s*$/.test(line)) {
              j++
              break
            }
            if (!line) {
              j++
              continue
            }
            const tabOpener = parseBlockOpener(line)
            if (tabOpener?.kind === 'tab') {
              const { nodes, endIndex } = collectUntilClosing(children, j + 1)
              tabItems.push({ name: tabOpener.name, contentNodes: nodes })
              j = endIndex
            } else {
              break
            }
          }
          if (tabItems.length) {
            newChildren.push(createTabsElement(tabItems))
            i = j - 1
            continue
          }
        }

        // 2b. Block form GitHub: ::: then github{repo="..."} then :::
        if (text === ':::') {
          let j = i + 1
          let parsed = null
          while (j < children.length) {
            const next = children[j]
            if (next.type !== 'element' || next.tagName !== 'p') break
            const nextText = getTextContent(next).trim()
            if (nextText === ':::') break
            if (!nextText) { j++; continue }
            parsed = parseDirective(nextText)
            if (parsed?.kind === 'github') { j++; break }
            break
          }
          if (parsed?.kind === 'github') {
            while (j < children.length) {
              const close = children[j]
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

        // 2c. Single-paragraph directive (admonition, github, details, steps, quote)
        const parsed = parseDirective(text)
        if (parsed) {
          if (parsed.kind === 'admonition') {
            newChildren.push(admonitionToHtml(parsed.type, parsed.content))
          } else if (parsed.kind === 'github') {
            const data = await fetchGitHubRepo(parsed.repo).catch(() => null)
            newChildren.push(createGitHubCardElement(parsed.repo, data))
          } else if (parsed.kind === 'details') {
            const contentNodes = parsed.content.split(/\n\n+/).map((p) => ({ type: 'element', tagName: 'p', properties: {}, children: [{ type: 'text', value: p.trim() }] }))
            newChildren.push(createDetailsElement(parsed.summary, contentNodes))
          } else if (parsed.kind === 'steps') {
            const steps = (parsed.lines || []).map((line) => ({ type: 'element', tagName: 'li', properties: {}, children: [{ type: 'text', value: line }] }))
            newChildren.push({ type: 'element', tagName: 'ol', properties: { className: ['directive-steps'] }, children: steps })
          } else if (parsed.kind === 'quote') {
            const contentNodes = parsed.content ? [{ type: 'element', tagName: 'p', properties: {}, children: [{ type: 'text', value: parsed.content }] }] : []
            newChildren.push(createQuoteElement(contentNodes, parsed.author, parsed.source))
          }
          continue
        }
      }

      newChildren.push(node)
  }
  return newChildren
}

export default function rehypeCustomDirectives() {
  return async (tree) => {
    if (!tree.children) return
    // Astro content often wraps body in a single div; process that layer first so tabs are found
    if (tree.children.length === 1) {
      const wrap = tree.children[0]
      if (wrap.type === 'element' && wrap.children?.length && ['div', 'section', 'article'].includes(wrap.tagName)) {
        wrap.children = await processChildren(wrap.children)
      }
    }
    async function processRecursive(node) {
      if (node.children && Array.isArray(node.children)) {
        node.children = await processChildren(node.children)
        for (const child of node.children) {
          await processRecursive(child)
        }
      }
    }
    await processRecursive(tree)
  }
}
