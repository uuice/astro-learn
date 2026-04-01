import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Application,
  Container,
  Graphics,
  Text,
  type FederatedPointerEvent,
} from 'pixi.js'

const W = 440
const H = 520
const TOTAL = 10
const POINTS_PER = 10

type Op = '+' | '-' | '*' | '/'
type DigitMode = 'single' | 'double'

const ALL_OPS: Op[] = ['+', '-', '*', '/']

/** HSL → RGB，与站点 --hue 联动（s/l ∈ [0,1]） */
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const H = ((h % 360) + 360) % 360
  const S = Math.max(0, Math.min(1, s))
  const L = Math.max(0, Math.min(1, l))
  const c = (1 - Math.abs(2 * L - 1)) * S
  const hh = H / 60
  const x = c * (1 - Math.abs((hh % 2) - 1))
  const m = L - c / 2
  let r = 0
  let g = 0
  let b = 0
  if (hh < 1) {
    r = c
    g = x
    b = 0
  } else if (hh < 2) {
    r = x
    g = c
    b = 0
  } else if (hh < 3) {
    r = 0
    g = c
    b = x
  } else if (hh < 4) {
    r = 0
    g = x
    b = c
  } else if (hh < 5) {
    r = x
    g = 0
    b = c
  } else {
    r = c
    g = 0
    b = x
  }
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)]
}

function toPixiHex(r: number, g: number, b: number): number {
  return ((r & 255) << 16) | ((g & 255) << 8) | (b & 255)
}

/** 基于站点色相的偏移（与 global.css chroma 思路一致） */
function themeHex(hueBase: number, hueOffset: number, s: number, l: number): number {
  const [r, g, b] = hslToRgb(hueBase + hueOffset, s, l)
  return toPixiHex(r, g, b)
}

function readCssHue(): number {
  if (typeof window === 'undefined') return 250
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--hue').trim()
  const n = parseInt(raw, 10)
  return Number.isFinite(n) ? ((n % 360) + 360) % 360 : 250
}

function buildPixiPalette(hue: number) {
  const h = ((hue % 360) + 360) % 360
  const tx = (off: number, s: number, l: number) => themeHex(h, off, s, l)
  return {
    bg: tx(0, 0.14, 0.07),
    panel: tx(0, 0.11, 0.1),
    panel2: tx(0, 0.13, 0.12),
    card: tx(8, 0.16, 0.17),
    cardHover: tx(18, 0.18, 0.24),
    accent: tx(0, 0.52, 0.62),
    accent2: tx(32, 0.48, 0.64),
    accent3: tx(58, 0.45, 0.62),
    accentHover: tx(18, 0.5, 0.7),
    text: 0xf0f2fa,
    muted: tx(0, 0.08, 0.52),
    prompt: tx(145, 0.42, 0.58),
    info: tx(200, 0.4, 0.56),
    keyword: tx(40, 0.45, 0.6),
    ok: tx(150, 0.48, 0.54),
    bad: tx(22, 0.52, 0.62),
    chipDigitOn: tx(30, 0.22, 0.28),
    chipOpOn: tx(34, 0.2, 0.26),
    chipOpOff: tx(0, 0.06, 0.11),
    opFill: {
      '+': tx(0, 0.55, 0.72),
      '-': tx(52, 0.5, 0.68),
      '*': tx(108, 0.5, 0.68),
      '/': tx(168, 0.48, 0.68),
    } as Record<Op, number>,
  }
}

function randomInt(min: number, max: number) {
  return min + Math.floor(Math.random() * (max - min + 1))
}

function generateProblem(mode: DigitMode, allowedOps: Op[]): { text: string; answer: number } {
  const ops = allowedOps.length > 0 ? allowedOps : ALL_OPS
  const op = ops[randomInt(0, ops.length - 1)]
  if (mode === 'single') {
    if (op === '+') {
      const a = randomInt(1, 9)
      const b = randomInt(1, 9)
      return { text: `${a} + ${b} = ?`, answer: a + b }
    }
    if (op === '-') {
      const a = randomInt(2, 9)
      const b = randomInt(1, a - 1)
      return { text: `${a} − ${b} = ?`, answer: a - b }
    }
    if (op === '*') {
      const a = randomInt(2, 9)
      const b = randomInt(2, 9)
      return { text: `${a} × ${b} = ?`, answer: a * b }
    }
    const divisor = randomInt(2, 9)
    const quotient = randomInt(2, 9)
    const dividend = divisor * quotient
    return { text: `${dividend} ÷ ${divisor} = ?`, answer: quotient }
  }

  if (op === '+') {
    const a = randomInt(10, 99)
    const b = randomInt(10, 99)
    return { text: `${a} + ${b} = ?`, answer: a + b }
  }
  if (op === '-') {
    const a = randomInt(20, 99)
    const b = randomInt(10, a - 10)
    return { text: `${a} − ${b} = ?`, answer: a - b }
  }
  if (op === '*') {
    const a = randomInt(10, 99)
    const b = randomInt(2, 9)
    return { text: `${a} × ${b} = ?`, answer: a * b }
  }
  const divisor = randomInt(2, 12)
  const quotient = randomInt(10, 99)
  const dividend = divisor * quotient
  return { text: `${dividend} ÷ ${divisor} = ?`, answer: quotient }
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildChoices(answer: number): number[] {
  const set = new Set<number>([answer])
  const span = Math.max(30, Math.min(120, Math.ceil(answer * 0.25)))
  let guard = 0
  while (set.size < 4 && guard < 400) {
    guard++
    const lo = Math.max(0, answer - span)
    const hi = answer + span
    set.add(randomInt(lo, hi))
  }
  while (set.size < 4) set.add(randomInt(0, Math.max(200, answer + 50)))
  return shuffle([...set])
}

export default function MathPixiGame() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const shellRef = useRef<HTMLDivElement>(null)
  const [fullscreen, setFullscreen] = useState(false)

  const toggleFullscreen = useCallback(() => {
    const el = shellRef.current
    if (!el) return
    if (!document.fullscreenElement) {
      void el.requestFullscreen?.().catch(() => {})
    } else {
      void document.exitFullscreen?.().catch(() => {})
    }
  }, [])

  useEffect(() => {
    const sync = () => setFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', sync)
    return () => document.removeEventListener('fullscreenchange', sync)
  }, [])

  useEffect(() => {
    const host = wrapRef.current
    if (!host) return

    const app = new Application()
    let destroyed = false
    let roundTimer: number | undefined
    let stageObserver: ResizeObserver | null = null
    let fsResizeHandler: (() => void) | null = null

    const run = async () => {
      const COL = buildPixiPalette(readCssHue())
      await app.init({
        width: W,
        height: H,
        background: COL.bg,
        antialias: true,
        resolution: typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1,
        autoDensity: true,
      })
      if (destroyed) {
        app.destroy(true)
        return
      }
      host.appendChild(app.canvas as HTMLCanvasElement)

      const root = new Container()
      app.stage.addChild(root)

      const rootFrame = new Graphics()
      rootFrame.roundRect(10, 10, W - 20, H - 20, 22)
      rootFrame.fill({ color: COL.panel, alpha: 0.94 })
      rootFrame.stroke({ width: 1, color: COL.accent2, alpha: 0.28 })
      root.addChild(rootFrame)

      const menuLayer = new Container()
      const gameLayer = new Container()
      const summaryLayer = new Container()
      summaryLayer.visible = false
      gameLayer.visible = false
      root.addChild(menuLayer)
      root.addChild(gameLayer)
      root.addChild(summaryLayer)

      const menuTitle = new Text({
        text: '本局设置',
        style: {
          fontFamily: 'ui-monospace, SF Mono, Menlo, monospace',
          fontSize: 22,
          fill: COL.accent2,
          align: 'center',
          letterSpacing: 1,
          dropShadow: {
            alpha: 0.45,
            angle: Math.PI / 2,
            blur: 4,
            color: 0x000000,
            distance: 1,
          },
        },
      })
      menuTitle.anchor.set(0.5, 0)
      menuTitle.x = W / 2
      menuTitle.y = 28
      menuLayer.addChild(menuTitle)

      const menuHint = new Text({
        text: '共 10 题 · 每题 10 分 · 满分 100',
        style: { fontFamily: 'system-ui, sans-serif', fontSize: 12, fill: COL.muted, align: 'center', lineHeight: 18 },
      })
      menuHint.anchor.set(0.5, 0)
      menuHint.x = W / 2
      menuHint.y = 56
      menuLayer.addChild(menuHint)

      const menuPanel = new Graphics()
      menuPanel.roundRect(18, 76, W - 36, 218, 16)
      menuPanel.fill({ color: COL.panel2, alpha: 0.55 })
      menuPanel.stroke({ width: 1, color: COL.accent3, alpha: 0.18 })
      menuLayer.addChildAt(menuPanel, 0)

      const menuLabelDigit = new Text({
        text: '难度',
        style: { fontFamily: 'system-ui, sans-serif', fontSize: 12, fill: COL.info },
      })
      menuLabelDigit.x = 36
      menuLabelDigit.y = 86
      menuLayer.addChild(menuLabelDigit)

      const menuLabelOp = new Text({
        text: '题型（可多选）',
        style: { fontFamily: 'system-ui, sans-serif', fontSize: 12, fill: COL.prompt },
      })
      menuLabelOp.x = 36
      menuLabelOp.y = 176
      menuLayer.addChild(menuLabelOp)

      const title = new Text({
        text: 'Pixi 算术挑战',
        style: {
          fontFamily: 'ui-monospace, SF Mono, Menlo, monospace',
          fontSize: 15,
          fill: COL.accent3,
          letterSpacing: 0.5,
        },
      })
      title.x = 20
      title.y = 14
      gameLayer.addChild(title)

      const scoreLabel = new Text({
        text: '得分 0 / 100',
        style: {
          fontFamily: 'ui-monospace, SF Mono, Menlo, monospace',
          fontSize: 15,
          fill: COL.accent,
          fontWeight: '600',
          dropShadow: { alpha: 0.35, angle: Math.PI / 2, blur: 3, color: 0x0a0a12, distance: 0 },
        },
      })
      scoreLabel.x = W - 130
      scoreLabel.y = 14
      gameLayer.addChild(scoreLabel)

      const progressLabel = new Text({
        text: '第 1/10 题',
        style: {
          fontFamily: 'ui-monospace, SF Mono, Menlo, monospace',
          fontSize: 13,
          fill: COL.info,
          letterSpacing: 0.5,
        },
      })
      progressLabel.anchor.set(0.5, 0)
      progressLabel.x = W / 2
      progressLabel.y = 42
      gameLayer.addChild(progressLabel)

      const qWrap = new Container()
      qWrap.x = W / 2
      qWrap.y = 118
      gameLayer.addChild(qWrap)

      const qCard = new Graphics()
      qCard.roundRect(-196, -46, 392, 92, 16)
      qCard.fill({ color: COL.panel2, alpha: 0.85 })
      qCard.stroke({ width: 1, color: COL.accent3, alpha: 0.35 })
      qWrap.addChild(qCard)

      const questionText = new Text({
        text: '',
        style: {
          fontFamily: 'ui-monospace, SF Mono, Menlo, monospace',
          fontSize: 30,
          fill: COL.text,
          align: 'center',
          fontWeight: '600',
          dropShadow: {
            alpha: 0.35,
            angle: Math.PI / 2,
            blur: 8,
            color: COL.accent,
            distance: 0,
          },
        },
      })
      questionText.anchor.set(0.5, 0.5)
      qWrap.addChild(questionText)

      const feedback = new Text({
        text: '',
        style: {
          fontFamily: 'system-ui, sans-serif',
          fontSize: 14,
          fill: COL.muted,
          align: 'center',
          fontWeight: '500',
        },
      })
      feedback.anchor.set(0.5, 0)
      feedback.x = W / 2
      feedback.y = 158
      gameLayer.addChild(feedback)

      const btnRoot = new Container()
      btnRoot.y = 196
      gameLayer.addChild(btnRoot)

      const gamePanel = new Graphics()
      gamePanel.roundRect(16, 36, W - 32, 300, 18)
      gamePanel.fill({ color: COL.panel2, alpha: 0.4 })
      gamePanel.stroke({ width: 1, color: COL.accent2, alpha: 0.15 })
      gameLayer.addChildAt(gamePanel, 0)

      let digitMode: DigitMode = 'single'
      let allowedOps: Op[] = ALL_OPS
      let questionIndex = 0
      let score = 0
      let correctCount = 0
      let wrongCount = 0
      let shakePhase = 0
      let bouncePhase = 0
      let lastAnswer = 0
      let inputLocked = false

      const buttons: { g: Graphics; label: Text; value: number }[] = []

      function paintBtn(g: Graphics, w: number, h: number, fill: number, strokeA: number) {
        g.clear()
        g.roundRect(0, 0, w, h, 12)
        g.fill(fill)
        g.stroke({ width: 1, color: COL.accent2, alpha: strokeA })
      }

      function makeAnswerButton(x: number, y: number, w: number, h: number, idx: number) {
        const c = new Container()
        c.x = x
        c.y = y
        c.eventMode = 'static'
        c.cursor = 'pointer'

        const g = new Graphics()
        paintBtn(g, w, h, COL.card, 0.38)
        c.addChild(g)

        const label = new Text({
          text: '',
          style: {
            fontFamily: 'ui-monospace, SF Mono, Menlo, monospace',
            fontSize: 22,
            fill: COL.text,
            align: 'center',
            fontWeight: '600',
          },
        })
        label.anchor.set(0.5, 0.5)
        label.x = w / 2
        label.y = h / 2
        c.addChild(label)

        btnRoot.addChild(c)
        buttons.push({ g, label, value: 0 })

        c.on('pointerover', () => {
          if (inputLocked || !gameLayer.visible) return
          paintBtn(g, w, h, COL.cardHover, 0.65)
        })
        c.on('pointerout', () => {
          if (inputLocked || !gameLayer.visible) return
          paintBtn(g, w, h, COL.card, 0.38)
        })
        c.on('pointertap', (e: FederatedPointerEvent) => {
          e.stopPropagation()
          if (inputLocked || !gameLayer.visible) return
          onPick(buttons[idx].value)
        })
      }

      const bw = 190
      const bh = 56
      const gap = 16
      const left = (W - (bw * 2 + gap)) / 2
      const positions = [
        [left, 0],
        [left + bw + gap, 0],
        [left, bh + gap],
        [left + bw + gap, bh + gap],
      ]
      for (let i = 0; i < 4; i++) {
        const [bx, by] = positions[i]
        makeAnswerButton(bx, by, bw, bh, i)
      }

      function redrawButtons(values: number[]) {
        values.forEach((v, i) => {
          buttons[i].label.text = String(v)
          buttons[i].value = v
        })
      }

      function bindMenuOrSummaryButton(
        container: Container,
        g: Graphics,
        w: number,
        h: number,
        onTap: () => void,
      ) {
        container.eventMode = 'static'
        container.cursor = 'pointer'
        container.on('pointerover', () => paintBtn(g, w, h, COL.accentHover, 0.6))
        container.on('pointerout', () => paintBtn(g, w, h, COL.card, 0.35))
        container.on('pointertap', (e: FederatedPointerEvent) => {
          e.stopPropagation()
          onTap()
        })
      }

      function addLabeledButton(
        parent: Container,
        x: number,
        y: number,
        w: number,
        h: number,
        line1: string,
        line2: string | undefined,
        onTap: () => void,
      ) {
        const c = new Container()
        c.x = x
        c.y = y
        const g = new Graphics()
        paintBtn(g, w, h, COL.card, 0.35)
        c.addChild(g)
        const t1 = new Text({
          text: line1,
          style: {
            fontFamily: 'ui-monospace, SF Mono, Menlo, monospace',
            fontSize: line2 ? 17 : 18,
            fill: COL.text,
            align: 'center',
          },
        })
        t1.anchor.set(0.5, line2 ? 0.65 : 0.5)
        t1.x = w / 2
        t1.y = h / 2
        c.addChild(t1)
        if (line2) {
          const t2 = new Text({
            text: line2,
            style: { fontFamily: 'system-ui, sans-serif', fontSize: 11, fill: COL.muted, align: 'center' },
          })
          t2.anchor.set(0.5, 0)
          t2.x = w / 2
          t2.y = h / 2 + 6
          c.addChild(t2)
        }
        parent.addChild(c)
        bindMenuOrSummaryButton(c, g, w, h, onTap)
      }

      const menuBtnW = 200
      const menuBtnH = 52
      const menuLeft = (W - menuBtnW) / 2

      let selectedDigitMode: DigitMode = 'single'
      const opSelected: Record<Op, boolean> = {
        '+': true,
        '-': true,
        '*': true,
        '/': true,
      }

      const digitW = 96
      const digitH = 46
      const digitGap = 10
      const digitRowLeft = (W - (digitW * 2 + digitGap)) / 2

      function paintDigitChip(g: Graphics, w: number, h: number, selected: boolean) {
        g.clear()
        g.roundRect(0, 0, w, h, 10)
        if (selected) {
          g.fill({ color: COL.chipDigitOn, alpha: 0.95 })
          g.stroke({ width: 2, color: COL.accent, alpha: 0.9 })
        } else {
          g.fill({ color: COL.card, alpha: 0.85 })
          g.stroke({ width: 1, color: COL.accent3, alpha: 0.3 })
        }
      }

      function paintOpChip(g: Graphics, w: number, h: number, on: boolean) {
        g.clear()
        g.roundRect(0, 0, w, h, 10)
        if (on) {
          g.fill({ color: COL.chipOpOn, alpha: 0.95 })
          g.stroke({ width: 2, color: COL.accent2, alpha: 0.85 })
        } else {
          g.fill({ color: COL.chipOpOff, alpha: 0.95 })
          g.stroke({ width: 1, color: COL.muted, alpha: 0.35 })
        }
      }

      const cDigitSingle = new Container()
      cDigitSingle.x = digitRowLeft
      cDigitSingle.y = 108
      cDigitSingle.eventMode = 'static'
      cDigitSingle.cursor = 'pointer'
      const gDigitSingle = new Graphics()
      paintDigitChip(gDigitSingle, digitW, digitH, true)
      cDigitSingle.addChild(gDigitSingle)
      const tDigitSingle = new Text({
        text: '个位数',
        style: { fontFamily: 'ui-monospace, SF Mono, Menlo, monospace', fontSize: 15, fill: COL.prompt },
      })
      tDigitSingle.anchor.set(0.5, 0.5)
      tDigitSingle.x = digitW / 2
      tDigitSingle.y = digitH / 2
      cDigitSingle.addChild(tDigitSingle)
      cDigitSingle.on('pointertap', () => {
        selectedDigitMode = 'single'
        paintDigitChip(gDigitSingle, digitW, digitH, true)
        paintDigitChip(gDigitDouble, digitW, digitH, false)
        tDigitSingle.style.fill = COL.prompt
        tDigitDouble.style.fill = COL.muted
      })
      menuLayer.addChild(cDigitSingle)

      const cDigitDouble = new Container()
      cDigitDouble.x = digitRowLeft + digitW + digitGap
      cDigitDouble.y = 108
      cDigitDouble.eventMode = 'static'
      cDigitDouble.cursor = 'pointer'
      const gDigitDouble = new Graphics()
      paintDigitChip(gDigitDouble, digitW, digitH, false)
      cDigitDouble.addChild(gDigitDouble)
      const tDigitDouble = new Text({
        text: '两位数',
        style: { fontFamily: 'ui-monospace, SF Mono, Menlo, monospace', fontSize: 15, fill: COL.muted },
      })
      tDigitDouble.anchor.set(0.5, 0.5)
      tDigitDouble.x = digitW / 2
      tDigitDouble.y = digitH / 2
      cDigitDouble.addChild(tDigitDouble)
      cDigitDouble.on('pointertap', () => {
        selectedDigitMode = 'double'
        paintDigitChip(gDigitSingle, digitW, digitH, false)
        paintDigitChip(gDigitDouble, digitW, digitH, true)
        tDigitSingle.style.fill = COL.muted
        tDigitDouble.style.fill = COL.info
      })
      menuLayer.addChild(cDigitDouble)

      const opChipW = 86
      const opChipH = 44
      const opGap = 8
      const opRowW = ALL_OPS.length * opChipW + (ALL_OPS.length - 1) * opGap
      const opRowLeft = (W - opRowW) / 2
      const opSymbol: Record<Op, string> = { '+': '+', '-': '−', '*': '×', '/': '÷' }
      const opGraphics: Record<Op, Graphics> = {
        '+': new Graphics(),
        '-': new Graphics(),
        '*': new Graphics(),
        '/': new Graphics(),
      }

      function refreshOpChips() {
        ALL_OPS.forEach((op) => {
          paintOpChip(opGraphics[op], opChipW, opChipH, opSelected[op])
        })
      }

      ALL_OPS.forEach((op, i) => {
        const c = new Container()
        c.x = opRowLeft + i * (opChipW + opGap)
        c.y = 198
        c.eventMode = 'static'
        c.cursor = 'pointer'
        const g = opGraphics[op]
        paintOpChip(g, opChipW, opChipH, opSelected[op])
        c.addChild(g)
        const t = new Text({
          text: opSymbol[op],
          style: {
            fontFamily: 'ui-monospace, SF Mono, Menlo, monospace',
            fontSize: 22,
            fill: COL.opFill[op],
          },
        })
        t.anchor.set(0.5, 0.5)
        t.x = opChipW / 2
        t.y = opChipH / 2
        c.addChild(t)
        c.on('pointertap', () => {
          const active = ALL_OPS.filter((o) => opSelected[o]).length
          if (opSelected[op] && active <= 1) return
          opSelected[op] = !opSelected[op]
          refreshOpChips()
        })
        menuLayer.addChild(c)
      })

      const cStart = new Container()
      cStart.x = menuLeft
      cStart.y = 262
      const gStart = new Graphics()
      paintBtn(gStart, menuBtnW, menuBtnH, COL.card, 0.4)
      cStart.addChild(gStart)
      const tStart = new Text({
        text: '开始游戏',
        style: { fontFamily: 'ui-monospace, SF Mono, Menlo, monospace', fontSize: 17, fill: COL.accent2 },
      })
      tStart.anchor.set(0.5, 0.5)
      tStart.x = menuBtnW / 2
      tStart.y = menuBtnH / 2
      cStart.addChild(tStart)
      menuLayer.addChild(cStart)
      bindMenuOrSummaryButton(cStart, gStart, menuBtnW, menuBtnH, () => {
        const ops = ALL_OPS.filter((o) => opSelected[o])
        if (ops.length === 0) {
          menuHint.text = '请至少选择一种题型'
          menuHint.style.fill = COL.bad
          return
        }
        menuHint.text = '共 10 题 · 每题 10 分 · 满分 100'
        menuHint.style.fill = COL.muted
        startRound(selectedDigitMode, ops)
      })

      const summaryTitle = new Text({
        text: '本轮结束',
        style: {
          fontFamily: 'ui-monospace, SF Mono, Menlo, monospace',
          fontSize: 22,
          fill: COL.accent2,
          align: 'center',
          letterSpacing: 1,
          dropShadow: {
            alpha: 0.4,
            angle: Math.PI / 2,
            blur: 5,
            color: 0x000000,
            distance: 1,
          },
        },
      })
      summaryTitle.anchor.set(0.5, 0)
      summaryTitle.x = W / 2
      summaryTitle.y = 40
      summaryLayer.addChild(summaryTitle)

      const summaryStats = new Text({
        text: '',
        style: {
          fontFamily: 'ui-monospace, SF Mono, Menlo, monospace',
          fontSize: 14,
          fill: COL.text,
          align: 'center',
          lineHeight: 22,
        },
      })
      summaryStats.anchor.set(0.5, 0)
      summaryStats.x = W / 2
      summaryStats.y = 92
      summaryLayer.addChild(summaryStats)

      const summaryPanel = new Graphics()
      summaryPanel.roundRect(18, 72, W - 36, 232, 16)
      summaryPanel.fill({ color: COL.panel2, alpha: 0.55 })
      summaryPanel.stroke({ width: 1, color: COL.accent3, alpha: 0.2 })
      summaryLayer.addChildAt(summaryPanel, 0)

      addLabeledButton(summaryLayer, menuLeft, 320, menuBtnW, menuBtnH, '重新开始', '返回本局设置', () => {
        summaryLayer.visible = false
        menuLayer.visible = true
      })

      function startRound(mode: DigitMode, ops: Op[]) {
        digitMode = mode
        allowedOps = ops.length > 0 ? ops : ALL_OPS
        questionIndex = 0
        score = 0
        correctCount = 0
        wrongCount = 0
        inputLocked = false
        feedback.text = ''
        feedback.style.fill = COL.muted
        menuLayer.visible = false
        summaryLayer.visible = false
        gameLayer.visible = true
        scoreLabel.text = '得分 0 / 100'
        nextQuestion()
      }

      function showSummary() {
        inputLocked = true
        gameLayer.visible = false
        summaryLayer.visible = true
        const pct = Math.round((correctCount / TOTAL) * 100)
        const opNames: Record<Op, string> = { '+': '加', '-': '减', '*': '乘', '/': '除' }
        const opLine = allowedOps.map((o) => opNames[o]).join('、')
        const diffLabel = digitMode === 'single' ? '个位数' : '两位数'
        summaryStats.text = `${diffLabel} · ${opLine}\n得分 ${score} / ${TOTAL * POINTS_PER}\n答对 ${correctCount} 题 · 答错 ${wrongCount} 题\n正确率 ${pct}%`
      }

      function onPick(v: number) {
        if (inputLocked) return
        const correct = v === lastAnswer
        if (correct) {
          score += POINTS_PER
          correctCount += 1
          feedback.text = '正确，+' + POINTS_PER + ' 分'
          feedback.style.fill = COL.ok
          bouncePhase = 18
        } else {
          wrongCount += 1
          feedback.text = `错误（答案 ${lastAnswer}）`
          feedback.style.fill = COL.bad
          shakePhase = 14
        }
        questionIndex += 1
        scoreLabel.text = `得分 ${score} / ${TOTAL * POINTS_PER}`
        inputLocked = true
        if (roundTimer !== undefined) clearTimeout(roundTimer)
        roundTimer = window.setTimeout(() => {
          roundTimer = undefined
          if (questionIndex >= TOTAL) {
            showSummary()
            return
          }
          feedback.text = ''
          feedback.style.fill = COL.muted
          nextQuestion()
        }, 480)
      }

      function nextQuestion() {
        inputLocked = false
        progressLabel.text = `第 ${questionIndex + 1}/${TOTAL} 题`
        const p = generateProblem(digitMode, allowedOps)
        lastAnswer = p.answer
        questionText.text = p.text
        redrawButtons(buildChoices(p.answer))
        buttons.forEach(({ g }) => paintBtn(g, bw, bh, COL.card, 0.38))
      }

      app.ticker.add(() => {
        if (shakePhase > 0) {
          qWrap.x = W / 2 + Math.sin(shakePhase * 0.9) * 6
          shakePhase -= 1
          if (shakePhase <= 0) qWrap.x = W / 2
        }
        if (bouncePhase > 0) {
          const s = 1 + Math.sin((18 - bouncePhase) * 0.35) * 0.08
          qWrap.scale.set(s)
          bouncePhase -= 1
          if (bouncePhase <= 0) qWrap.scale.set(1)
        }
      })

      function fitStage() {
        if (destroyed) return
        const el = wrapRef.current
        if (!el) return
        const cw = Math.max(1, Math.floor(el.clientWidth))
        const ch = Math.max(1, Math.floor(el.clientHeight))
        app.renderer.resize(cw, ch)
        const s = Math.min(cw / W, ch / H)
        root.scale.set(s)
        root.position.set((cw - W * s) / 2, (ch - H * s) / 2)
      }

      fitStage()
      stageObserver = new ResizeObserver(() => {
        requestAnimationFrame(() => fitStage())
      })
      stageObserver.observe(host)
      fsResizeHandler = () => requestAnimationFrame(() => fitStage())
      document.addEventListener('fullscreenchange', fsResizeHandler)
    }

    run()

    return () => {
      destroyed = true
      if (roundTimer !== undefined) clearTimeout(roundTimer)
      if (fsResizeHandler) document.removeEventListener('fullscreenchange', fsResizeHandler)
      stageObserver?.disconnect()
      const hostEl = wrapRef.current
      app.destroy(true, { children: true })
      if (hostEl && app.canvas?.parentNode === hostEl) hostEl.removeChild(app.canvas as HTMLCanvasElement)
    }
  }, [])

  return (
    <div
      ref={shellRef}
      className="math-pixi-shell relative mx-auto max-w-full overflow-hidden rounded-xl border section-card"
      style={{ borderColor: 'var(--card-border)' }}
      role="region"
      aria-label="Pixi 算术小游戏"
    >
      <button
        type="button"
        className="absolute right-3 top-3 z-10 rounded border px-2.5 py-1 font-mono text-xs transition-opacity hover:opacity-90"
        style={{
          borderColor: 'var(--card-border)',
          background: 'var(--card-bg)',
          color: 'var(--text-muted)',
          fontSize: 'var(--text-xs)',
        }}
        onClick={toggleFullscreen}
        aria-pressed={fullscreen}
        aria-label={fullscreen ? '退出全屏' : '全屏'}
      >
        <span className="code-label">$</span> {fullscreen ? '退出全屏' : '全屏'}
      </button>
      <div ref={wrapRef} className="math-pixi-canvas-host math-pixi-game overflow-hidden rounded-xl" />
    </div>
  )
}
