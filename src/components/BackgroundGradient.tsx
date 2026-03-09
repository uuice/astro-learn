import { useEffect, useRef } from 'react'

const PARTICLE_COUNT = 40
const MAX_R = 3
const SPEED = 0.2
const LINK_DISTANCE = 140

function getAccentColor(): string {
  if (typeof document === 'undefined') return 'oklch(0.55 0.2 250)'
  const hue = getComputedStyle(document.documentElement).getPropertyValue('--hue').trim() || '250'
  const dark = document.documentElement.classList.contains('dark')
  const L = dark ? 0.7 : 0.55
  const C = dark ? 0.18 : 0.2
  return `oklch(${L} ${C} ${hue})`
}

export default function BackgroundGradient() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    type Particle = { x: number; y: number; r: number; vx: number; vy: number }
    const particles: Particle[] = []
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: 0.5 + Math.random() * MAX_R,
        vx: (Math.random() - 0.5) * SPEED,
        vy: (Math.random() - 0.5) * SPEED,
      })
    }

    let raf: number
    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const color = getAccentColor()
      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1
      }
      ctx.strokeStyle = color
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i]
          const b = particles[j]
          const dx = b.x - a.x
          const dy = b.y - a.y
          const d = Math.hypot(dx, dy)
          if (d < LINK_DISTANCE) {
            ctx.globalAlpha = 0.35 * (1 - d / LINK_DISTANCE)
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.stroke()
          }
        }
      }
      ctx.globalAlpha = 0.55
      ctx.fillStyle = color
      for (const p of particles) {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="fixed inset-0 pointer-events-none -z-10"
      style={{ width: '100%', height: '100%' }}
    />
  )
}
