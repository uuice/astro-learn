/**
 * Remark plugin: custom directives - Admonitions, GitHub cards, Details, Tabs, Steps, Quote.
 * Works at mdast level; uses data.hName/data.hProperties for hast output.
 */

const ADMONITION_TYPES = ['note', 'tip', 'important', 'caution', 'warning']
const TITLE_MAP = { note: 'Note', tip: 'Tip', important: 'Important', caution: 'Caution', warning: 'Warning' }

function getText(node) {
  if (!node || !node.children) return ''
  return node.children
    .map((c) => (c.type === 'text' ? c.value : c.type === 'paragraph' ? getText(c) : ''))
    .join('')
}

function parseAttrs(str = '') {
  const attrs = {}
  const re = /(\w+)\s*=\s*(?:"([^"]*)"|'([^']*)'|[\u201C\u201D"]([^\u201C\u201D"]*)[\u201C\u201D"]|([^}\s,]+))/g
  let m
  while ((m = re.exec(str)) !== null) {
    const val = (m[2] ?? m[3] ?? m[4] ?? m[5] ?? '').trim()
    if (val) attrs[m[1]] = val
  }
  return attrs
}

function parseOpener(text) {
  const t = (text || '').trim()
  const m = t.match(/^:{3,}(\w+)(?:\s*\{([^}]*)\})?(?:\s+(.+))?$/)
  if (!m) return null
  const [, name, attrStr, rest] = m
  const attrs = parseAttrs(attrStr || '')
  return { name, attrs, rest: rest?.trim() }
}

/** Parse single-paragraph block: full directive in one string (e.g. :::note\ncontent\n:::) */
function parseBlockInOne(text) {
  const t = (text || '').trim().replace(/\r\n/g, '\n')
  const types = ADMONITION_TYPES.join('|')
  const admonitionRe = new RegExp(`^:::(${types})\\s+([\\s\\S]*?)\\s*:::\\s*$`)
  const am = t.match(admonitionRe)
  if (am) return { kind: 'admonition', type: am[1], content: am[2].trim() }

  const detailsRe = /^:::details(?:\{([^}]*)\})?(?:\s+([^\n]*))?\s+([\s\S]*?)\s*:::\s*$/
  const dm = t.match(detailsRe)
  if (dm) {
    const attrs = parseAttrs(dm[1])
    return { kind: 'details', summary: attrs.summary || dm[2]?.trim() || '点击展开', content: dm[3].trim() }
  }

  const stepsRe = /^:::steps\s+([\s\S]*?)\s*:::\s*$/
  const sm = t.match(stepsRe)
  if (sm) return { kind: 'steps', lines: sm[1].split(/\n/).map((s) => s.trim()).filter(Boolean) }

  const quoteRe = /^:::quote(?:\{([^}]*)\})?\s+([\s\S]*?)\s*:::\s*$/
  const qm = t.match(quoteRe)
  if (qm) {
    const attrs = parseAttrs(qm[1])
    return { kind: 'quote', author: attrs.author, source: attrs.source, content: qm[2].trim() }
  }

  const ghRe = /^:::\s+github\s*\{\s*repo\s*=\s*["\u201C\u201D]?([^"\u201C\u201D]+)["\u201C\u201D]?\s*\}\s*:::\s*$/
  const gm = t.match(ghRe)
  if (gm) return { kind: 'github', repo: gm[1].trim() }

  return null
}

/** Collect sibling nodes until paragraph with :::, return { nodes, endIndex } */
function collectUntilClosing(children, startIdx) {
  const nodes = []
  let j = startIdx
  while (j < children.length) {
    const n = children[j]
    const text = n.type === 'paragraph' ? getText(n).trim() : ''
    if (n.type === 'paragraph' && /^:{3,}\s*$/.test(text)) {
      j++
      break
    }
    nodes.push(n)
    j++
  }
  return { nodes, endIndex: j }
}

/** Create mdast node that renders as HTML element via data.hName */
function htmlNode(tagName, props, children) {
  return {
    type: 'paragraph', // use paragraph as base so it's valid mdast
    data: { hName: tagName, hProperties: props || {} },
    children: children || [],
  }
}

/** Create admonition (div.admonition) */
function createAdmonition(type, contentNodes) {
  const title = TITLE_MAP[type] || type
  const variant = type === 'note' ? '' : ` bdm-${type}`
  const titleNode = htmlNode('span', { className: ['bdm-title'] }, [{ type: 'text', value: title }])
  return htmlNode('div', { className: ['admonition', `admonition-${type}${variant}`.trim()] }, [titleNode, ...contentNodes])
}

/** Create details/summary */
function createDetails(summary, contentNodes) {
  const summaryNode = htmlNode('summary', {}, [{ type: 'text', value: summary }])
  const contentWrap = htmlNode('div', { className: ['directive-details-content'] }, contentNodes)
  return htmlNode('details', { className: ['directive-details'] }, [summaryNode, contentWrap])
}

/** Create steps (ol.directive-steps) */
function createSteps(contentNodes) {
  const items = (contentNodes || [])
    .map((n) => getText(n).trim())
    .filter(Boolean)
    .map((line) => htmlNode('li', {}, [{ type: 'text', value: line }]))
  return htmlNode('ol', { className: ['directive-steps'] }, items)
}

/** Create quote blockquote */
function createQuote(contentNodes, author, source) {
  const footerParts = [author, source].filter(Boolean)
  const footerText = footerParts.length ? `— ${footerParts.join(', ')}` : ''
  const children = [...(contentNodes || [])]
  if (footerText) {
    children.push(htmlNode('footer', { className: ['directive-quote-footer'] }, [{ type: 'text', value: footerText }]))
  }
  return htmlNode('blockquote', { className: ['directive-quote'] }, children)
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

/** Create GitHub card - needs hast structure for nested elements, use hChildren */
function createGitHubCard(repo, data) {
  const url = data ? data.url : `https://github.com/${repo}`
  const repoName = data ? data.name : repo.split('/')[1] || repo
  const className = ['card-github', 'no-styling']
  if (!data) className.push('fetch-error')

  const hChildren = [
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
                { type: 'element', tagName: 'span', properties: { className: ['gc-repo'] }, children: [{ type: 'text', value: repoName }] },
              ],
            },
          ],
        },
      ],
    },
    ...(data?.description || !data
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
    type: 'paragraph',
    data: {
      hName: 'a',
      hProperties: { href: url, className, target: '_blank', rel: 'noopener noreferrer' },
      hChildren,
    },
    children: [],
  }
}

/** Transform :::tabs ... :::endtabs block. Supports :::tab Title and :::tab{name="X"} */
function transformTabs(children, startIdx) {
  const tabItems = []
  let j = startIdx + 1
  let current = null

  while (j < children.length) {
    const node = children[j]
    const isParagraph = node.type === 'paragraph'
    const text = isParagraph ? getText(node).trim() : ''

    if (isParagraph && /^:{3,}endtabs\s*$/.test(text)) {
      j++
      break
    }

    if (isParagraph && !text) {
      j++
      continue
    }

    if (isParagraph && /^:{3,}endtab\s*$/.test(text)) {
      current = null
      j++
      continue
    }

    // :::tab Title or :::tab{name="X"}
    if (isParagraph) {
      const plainMatch = text.match(/^:{3,}tab\s+(.+)$/)
      const attrMatch = parseOpener(text)
      const tabName = attrMatch?.name === 'tab'
        ? (attrMatch.attrs.name || attrMatch.rest || 'Tab')
        : plainMatch
          ? plainMatch[1].trim()
          : null
      if (tabName) {
        current = { title: tabName, body: [] }
        tabItems.push(current)
        j++
        continue
      }
    }

    if (!current) break
    current.body.push(node)
    j++
  }

  if (!tabItems.length) return null

  const groupName = 'tabs-' + Math.random().toString(36).slice(2, 10)
  const flat = []

  tabItems.forEach((tab, idx) => {
    flat.push(htmlNode('input', { type: 'radio', name: groupName, id: `${groupName}-${idx}`, className: ['directive-tabs-input'], checked: idx === 0 }, []))
    flat.push(htmlNode('label', { className: ['directive-tabs-label'], htmlFor: `${groupName}-${idx}` }, [{ type: 'text', value: tab.title }]))
    flat.push(htmlNode('div', { className: ['directive-tabs-panel'] }, tab.body))
  })

  return {
    node: htmlNode('div', { className: ['directive-tabs'] }, flat),
    endIndex: j,
  }
}

/** Transform :::tabs + :::tab{name="X"} ... ::: until ::: (rehype-style syntax) */
function transformTabsRehypeStyle(children, startIdx) {
  const tabItems = []
  let j = startIdx + 1

  while (j < children.length) {
    const n = children[j]
    if (n.type !== 'paragraph') break
    const line = getText(n).trim()
    if (/^:{3,}\s*$/.test(line)) {
      j++
      break
    }
    if (!line) {
      j++
      continue
    }
    const po = parseOpener(line)
    if (po && po.name === 'tab') {
      const tabName = po.attrs.name || po.rest || 'Tab'
      const { nodes, endIndex } = collectUntilClosing(children, j + 1)
      tabItems.push({ name: tabName, contentNodes: nodes })
      j = endIndex
    } else {
      break
    }
  }

  if (!tabItems.length) return null

  const groupName = 'tabs-' + Math.random().toString(36).slice(2, 10)
  const flat = []
  tabItems.forEach((tab, idx) => {
    flat.push(htmlNode('input', { type: 'radio', name: groupName, id: `${groupName}-${idx}`, className: ['directive-tabs-input'], checked: idx === 0 }, []))
    flat.push(htmlNode('label', { className: ['directive-tabs-label'], htmlFor: `${groupName}-${idx}` }, [{ type: 'text', value: tab.name }]))
    flat.push(htmlNode('div', { className: ['directive-tabs-panel'] }, tab.contentNodes))
  })

  return {
    node: htmlNode('div', { className: ['directive-tabs'] }, flat),
    endIndex: j,
  }
}

export default function remarkCustomDirectives() {
  return async (tree) => {
    if (!tree || !tree.children) return
    // Process root; also process single wrapper (e.g. some setups wrap in div/section)
    async function process(parent) {
      if (!parent.children || !Array.isArray(parent.children)) return
      const src = parent.children
      const out = []

      for (let i = 0; i < src.length; i++) {
        const node = src[i]

        if (node.type === 'blockquote' && node.children?.length) {
          const firstText = getText(node.children[0]).trim()
          const blockquoteMatch = firstText.match(/^\[!(NOTE|TIP|IMPORTANT|CAUTION|WARNING)\]$/i)
          if (blockquoteMatch) {
            const type = blockquoteMatch[1].toLowerCase()
            const contentNodes = node.children.slice(1)
            out.push(createAdmonition(type, contentNodes))
            continue
          }
        }

        if (node.type === 'paragraph') {
          const text = getText(node).trim()

          // Admonition opener :::note etc.
          const admonitionMatch = text.match(new RegExp(`^:::(${ADMONITION_TYPES.join('|')})\\s*$`))
          if (admonitionMatch) {
            const type = admonitionMatch[1]
            const { nodes, endIndex } = collectUntilClosing(src, i + 1)
            out.push(createAdmonition(type, nodes))
            i = endIndex - 1
            continue
          }

          // Block openers: details, steps, quote
          const opener = parseOpener(text)
          if (opener) {
            if (opener.name === 'details') {
              const summary = opener.attrs.summary || opener.rest || '点击展开'
              const { nodes, endIndex } = collectUntilClosing(src, i + 1)
              out.push(createDetails(summary, nodes))
              i = endIndex - 1
              continue
            }
            if (opener.name === 'steps') {
              const { nodes, endIndex } = collectUntilClosing(src, i + 1)
              out.push(createSteps(nodes))
              i = endIndex - 1
              continue
            }
            if (opener.name === 'quote') {
              const { nodes, endIndex } = collectUntilClosing(src, i + 1)
              out.push(createQuote(nodes, opener.attrs.author, opener.attrs.source))
              i = endIndex - 1
              continue
            }
          }

          // Tabs: :::tabs (remark style with :::tab Title :::endtab :::endtabs)
          if (/^:{3,}tabs\s*$/.test(text)) {
            const res = transformTabs(src, i)
            if (res) {
              out.push(res.node)
              i = res.endIndex - 1
              continue
            }
            // Try rehype style: :::tab{name="X"} ... :::
            const res2 = transformTabsRehypeStyle(src, i)
            if (res2) {
              out.push(res2.node)
              i = res2.endIndex - 1
              continue
            }
          }

          // GitHub block: ::: then github{repo="x"} then :::
          if (text === ':::') {
            let j = i + 1
            let repo = null
            while (j < src.length) {
              const next = src[j]
              if (next.type !== 'paragraph') break
              const nextText = getText(next).trim()
              if (nextText === ':::') break
              if (!nextText) {
                j++
                continue
              }
              const ghMatch = nextText.match(/github\s*\{\s*repo\s*=\s*["\u201C\u201D]?([^"\u201C\u201D]+)["\u201C\u201D]?\s*\}/)
              if (ghMatch) {
                repo = ghMatch[1].trim()
                j++
                break
              }
              break
            }
            if (repo) {
              while (j < src.length) {
                const close = src[j]
                if (close.type === 'paragraph' && /^:{3,}\s*$/.test(getText(close).trim())) {
                  j++
                  break
                }
                j++
              }
              const data = await fetchGitHubRepo(repo).catch(() => null)
              out.push(createGitHubCard(repo, data))
              i = j - 1
              continue
            }
          }

          // Single-paragraph GitHub: ::github{repo="x"}
          const ghSingle = text.match(/^::github\s*\{\s*repo\s*=\s*["\u201C\u201D]?([^"\u201C\u201D]+)["\u201C\u201D]?\s*\}$/)
          if (ghSingle) {
            const repo = ghSingle[1].trim()
            const data = await fetchGitHubRepo(repo).catch(() => null)
            out.push(createGitHubCard(repo, data))
            continue
          }

          // Single-paragraph directive: :::type content ::: in one paragraph
          const blockInOne = parseBlockInOne(text)
          if (blockInOne) {
            if (blockInOne.kind === 'admonition') {
              const contentNodes = blockInOne.content
                ? [{ type: 'paragraph', children: [{ type: 'text', value: blockInOne.content }] }]
                : []
              out.push(createAdmonition(blockInOne.type, contentNodes))
              continue
            }
            if (blockInOne.kind === 'details') {
              const contentNodes = blockInOne.content
                ? [{ type: 'paragraph', children: [{ type: 'text', value: blockInOne.content }] }]
                : []
              out.push(createDetails(blockInOne.summary, contentNodes))
              continue
            }
            if (blockInOne.kind === 'steps') {
              const lineNodes = (blockInOne.lines || []).map((line) => ({ type: 'paragraph', children: [{ type: 'text', value: line }] }))
              out.push(createSteps(lineNodes))
              continue
            }
            if (blockInOne.kind === 'quote') {
              const contentNodes = blockInOne.content
                ? [{ type: 'paragraph', children: [{ type: 'text', value: blockInOne.content }] }]
                : []
              out.push(createQuote(contentNodes, blockInOne.author, blockInOne.source))
              continue
            }
            if (blockInOne.kind === 'github') {
              const data = await fetchGitHubRepo(blockInOne.repo).catch(() => null)
              out.push(createGitHubCard(blockInOne.repo, data))
              continue
            }
          }
        }

        out.push(node)
        if (node.children) await process(node)
      }

      parent.children = out
    }

    await process(tree)
  }
}
