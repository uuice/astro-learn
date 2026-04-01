import * as vscode from 'vscode'
import { converter, toGamut } from 'culori'

/** CSS Color 4 色域映射（culori 默认 delta/jnd 对齐规范），再转 RGB */
const mapOklchToSrgb = toGamut('rgb', 'oklch')
const toRgb = converter('rgb')

/** 从整份文档取第一个 `--hue: <number>`（与 :root 里写法一致即可） */
function extractHueFromDocument(text: string): number | null {
  const m = text.match(/--hue:\s*([\d.]+)\s*;/)
  if (!m) return null
  const n = parseFloat(m[1])
  return Number.isFinite(n) ? n : null
}

/** 解析 oklch 第三分量：数字 / var(--hue) / calc(var(--hue) ± n) */
function resolveHueComponent(raw: string, baseHue: number): number | null {
  const t = raw.trim()
  const direct = parseFloat(t)
  if (!Number.isNaN(direct) && /^[\d.+-eE]+$/.test(t)) return direct

  if (t === 'var(--hue)' || /^var\s*\(\s*--hue\s*\)$/.test(t)) return baseHue

  const calc = t.match(
    /^calc\s*\(\s*var\s*\(\s*--hue\s*\)\s*([+-])\s*([\d.]+)\s*\)$/i,
  )
  if (calc) {
    const delta = parseFloat(calc[2])
    if (!Number.isFinite(delta)) return null
    return calc[1] === '+' ? baseHue + delta : baseHue - delta
  }

  return null
}

function oklchToVsColor(l: number, c: number, h: number): vscode.Color | null {
  const ok = { mode: 'oklch' as const, l, c, h }
  const rgb = toRgb(mapOklchToSrgb(ok))
  if (!rgb || rgb.mode !== 'rgb') return null
  const { r, g, b } = rgb as { r: number; g: number; b: number; alpha?: number }
  /** culori 多为 0–1；偶发 0–255；VS Code 需要 0–1 且非负 */
  const ch = (x: number) => {
    const v = x > 1 ? x / 255 : x
    return Math.min(1, Math.max(0, v))
  }
  return new vscode.Color(ch(r), ch(g), ch(b), rgb.alpha ?? 1)
}

/** 与 oklch 开括号匹配的闭括号下标（含嵌套括号） */
function indexOfMatchingCloseParen(s: string, openIdx: number): number {
  if (s[openIdx] !== '(') return -1
  let depth = 0
  for (let i = openIdx; i < s.length; i++) {
    if (s[i] === '(') depth++
    else if (s[i] === ')') {
      depth--
      if (depth === 0) return i
    }
  }
  return -1
}

/**
 * 扫描 `oklch(L C H)`。H 可含 `)`（如 var(--hue)、calc(...)），不能用 [^)]+。
 */
function collectOklchCalls(text: string): Array<{ start: number; end: number; l: number; c: number; hRaw: string }> {
  const out: Array<{ start: number; end: number; l: number; c: number; hRaw: string }> = []
  let searchFrom = 0
  const lower = 'oklch('
  while (searchFrom < text.length) {
    const idx = text.indexOf(lower, searchFrom)
    if (idx === -1) break
    const openParen = idx + lower.length - 1
    const closeParen = indexOfMatchingCloseParen(text, openParen)
    if (closeParen < 0) {
      searchFrom = idx + 1
      continue
    }
    const inner = text.slice(openParen + 1, closeParen)
    const m = inner.match(/^\s*([\d.]+)\s+([\d.]+)\s+([\s\S]+)$/)
    if (!m) {
      searchFrom = idx + 1
      continue
    }
    const l = parseFloat(m[1])
    const c = parseFloat(m[2])
    const hRaw = m[3].trim()
    out.push({ start: idx, end: closeParen + 1, l, c, hRaw })
    searchFrom = closeParen + 1
  }
  return out
}

const CSS_LIKE = new Set(['css', 'scss', 'less', 'postcss', 'tailwindcss'])

function provideDocumentColors(document: vscode.TextDocument): vscode.ColorInformation[] {
  if (!CSS_LIKE.has(document.languageId)) {
    return []
  }

  const text = document.getText()
  const baseHue = extractHueFromDocument(text)
  if (baseHue === null) return []

  const out: vscode.ColorInformation[] = []
  for (const call of collectOklchCalls(text)) {
    const h = resolveHueComponent(call.hRaw, baseHue)
    if (h === null || !Number.isFinite(call.l) || !Number.isFinite(call.c)) continue

    const range = new vscode.Range(
      document.positionAt(call.start),
      document.positionAt(call.end),
    )
    const color = oklchToVsColor(call.l, call.c, h)
    if (!color) continue
    out.push({ range, color })
  }

  return out
}

export function activate(context: vscode.ExtensionContext): void {
  const provider: vscode.DocumentColorProvider = {
    provideDocumentColors: (doc) => provideDocumentColors(doc),
    provideColorPresentations(_color, _ctx) {
      return []
    },
  }

  const selector = ['css', 'scss', 'less', 'postcss', 'tailwindcss'].map((language) => ({
    scheme: 'file',
    language,
  }))
  context.subscriptions.push(vscode.languages.registerColorProvider(selector, provider))
}

export function deactivate() {}
