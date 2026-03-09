import { useState, useEffect } from 'react'

const WORK_END_HOUR = 18
const WORK_END_MINUTE = 0

interface HolidayItem {
  name: string
  start: string
  end: string
  days: number
  workDays?: string[]
}

export interface SidebarCountdownProps {
  year: number
  holidays: HolidayItem[]
}

function toDateOnly(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function parseDateOnly(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export default function SidebarCountdown({ holidays }: SidebarCountdownProps) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const todayStr = toDateOnly(now)
  const workEndToday = new Date(now)
  workEndToday.setHours(WORK_END_HOUR, WORK_END_MINUTE, 0, 0)

  let offWorkText: string
  if (now >= workEndToday) {
    offWorkText = '已下班'
  } else {
    const ms = workEndToday.getTime() - now.getTime()
    const h = Math.floor(ms / 3600000)
    const m = Math.floor((ms % 3600000) / 60000)
    offWorkText = `距离下班 ${h} 小时 ${m} 分`
  }

  const sorted = [...holidays].sort((a, b) => a.start.localeCompare(b.start))
  const pastHolidays = sorted.filter((h) => h.end < todayStr)
  const remainingHolidays = sorted.filter((h) => h.end >= todayStr)

  let holidayText: string
  const inHoliday = sorted.find((h) => todayStr >= h.start && todayStr <= h.end)
  if (inHoliday) {
    const end = parseDateOnly(inHoliday.end)
    const left = Math.ceil((end.getTime() - now.getTime()) / 86400000)
    holidayText = `正在放 ${inHoliday.name}，还剩 ${left} 天`
  } else {
    const next = sorted.find((h) => h.start > todayStr)
    if (next) {
      const start = parseDateOnly(next.start)
      const days = Math.ceil((start.getTime() - now.getTime()) / 86400000)
      holidayText = `距离 ${next.name} 还有 ${days} 天`
    } else {
      holidayText = '暂无假期'
    }
  }

  const formatRange = (h: HolidayItem) => `${h.start.slice(5)}-${h.end.slice(5)} ${h.days}天`

  return (
    <div
      className="section-card p-4 overflow-hidden"
      style={{ borderRadius: 'var(--radius)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}
    >
      <h3 className="section-title">
        <span className="section-prompt">$</span> countdown
      </h3>
      <div className="mt-2 space-y-2" style={{ color: 'var(--text-muted)' }}>
        <p className="m-0">{offWorkText}</p>
        <p className="m-0">{holidayText}</p>
      </div>
      {pastHolidays.length > 0 && (
        <div className="mt-3 pt-2 border-t" style={{ borderColor: 'var(--card-border)' }}>
          <p className="m-0 mb-1" style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>已过假期</p>
          <ul className="m-0 pl-4 space-y-0.5 list-disc" style={{ color: 'var(--text-muted)' }}>
            {pastHolidays.map((h) => (
              <li key={h.name}>
                {h.name} {formatRange(h)}
              </li>
            ))}
          </ul>
        </div>
      )}
      {remainingHolidays.length > 0 && (
        <div className="mt-3 pt-2 border-t" style={{ borderColor: 'var(--card-border)' }}>
          <p className="m-0 mb-1" style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>剩余假期</p>
          <ul className="m-0 pl-4 space-y-0.5 list-disc" style={{ color: 'var(--text-muted)' }}>
            {remainingHolidays.map((h) => (
              <li key={h.name}>
                {h.name} {formatRange(h)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
