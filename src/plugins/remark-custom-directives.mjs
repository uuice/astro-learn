function getText(node) {
  if (!node || !node.children) return ''
  return node.children.map((c) => (c.type === 'text' ? c.value : '')).join('')
}

function parseAttrs(str = '') {
  const attrs = {}
  // 支持 " ' 以及中文引号 “ ”
  const re = /(\w+)\s*=\s*(?:"([^"]*)"|'([^']*)'|[\u201C\u201D]([^\u201C\u201D]*)[\u201C\u201D]|([^}\s,]+))/g
  let m
  while ((m = re.exec(str)) !== null) {
    const val = (m[2] ?? m[3] ?? m[4] ?? m[5] ?? '').trim()
    if (val) attrs[m[1]] = val
  }
  return attrs
}

function parseOpener(text) {
  const t = (text || '').trim()
  const m = t.match(/^:{3,}(\w+)(?:\{([^}]*)\})?(?:\s+(.+))?$/)
  if (!m) return null
  const [, name, attrStr, rest] = m
  const attrs = parseAttrs(attrStr)
  return { name, attrs, rest: rest?.trim() }
}

// Transform a :::tabs ... :::endtabs block in a children array, starting at index startIdx
function transformTabs(children, startIdx) {
  const tabItems = []
  let j = startIdx + 1
  let current = null

  while (j < children.length) {
    const node = children[j]
    const isParagraph = node.type === 'paragraph'
    const text = isParagraph ? getText(node).trim() : ''

    // 结束整个 tabs 组
    if (isParagraph && /^:{3,}endtabs\s*$/.test(text)) {
      j++
      break
    }

    // 段落里的空行，跳过
    if (isParagraph && !text) {
      j++
      continue
    }

    // 结束当前 tab
    if (isParagraph && /^:{3,}endtab\s*$/.test(text)) {
      current = null
      j++
      continue
    }

    // 新的 tab 起始（只支持 :::tab 标题 这一种，更简单稳定）
    if (isParagraph) {
      const m = text.match(/^:{3,}tab\s+(.+)$/)
      if (m) {
        current = {
          title: m[1].trim(),
          body: [],
        }
        tabItems.push(current)
        j++
        continue
      }
    }

    // 其它节点：如果当前在某个 tab 里，则视为内容；否则 tabs 结束
    if (!current) break
    current.body.push(node)
    j++
  }

  if (!tabItems.length) return null

  const tabsNode = {
    type: 'tabs',
    data: {
      hName: 'div',
      hProperties: { className: ['directive-tabs'] },
    },
    children: [],
  }

  const groupName = 'tabs-' + Math.random().toString(36).slice(2, 10)

  tabItems.forEach((tab, idx) => {
    tabsNode.children.push({
      type: 'tabsInput',
      data: {
        hName: 'input',
        hProperties: {
          type: 'radio',
          name: groupName,
          id: `${groupName}-${idx}`,
          className: ['directive-tabs-input'],
          checked: idx === 0,
        },
      },
      children: [],
    })
    tabsNode.children.push({
      type: 'tabsLabel',
      data: {
        hName: 'label',
        hProperties: {
          className: ['directive-tabs-label'],
          htmlFor: `${groupName}-${idx}`,
        },
      },
      children: [{ type: 'text', value: tab.title }],
    })
    tabsNode.children.push({
      type: 'tabsPanel',
      data: {
        hName: 'div',
        hProperties: { className: ['directive-tabs-panel'] },
      },
      children: tab.body,
    })
  })

  return { node: tabsNode, endIndex: j }
}

export default function remarkCustomDirectives() {
  return (tree) => {
    function process(parent) {
      if (!parent.children || !Array.isArray(parent.children)) return
      const src = parent.children
      const out = []

      for (let i = 0; i < src.length; i++) {
        const node = src[i]

        if (node.type === 'paragraph') {
          const text = getText(node).trim()

          // Tabs block
          if (/^:{3,}tabs\s*$/.test(text)) {
            const res = transformTabs(src, i)
            if (res) {
              out.push(res.node)
              i = res.endIndex - 1
              continue
            }
          }
        }

        out.push(node)
        if (node.children) process(node)
      }

      parent.children = out
    }

    process(tree)
  }
}

