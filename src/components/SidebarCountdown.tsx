import { useState, useEffect } from 'react'

const WORK_START_HOUR = 9
const WORK_START_MINUTE = 0
const WORK_END_HOUR = 18
const WORK_END_MINUTE = 0

function isWeekend(d: Date): boolean {
  const day = d.getDay()
  return day === 0 || day === 6
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

/** 下一个需要到岗的工作日早晨（跳过周末） */
function getNextWorkStart(from: Date): Date {
  if (isWeekend(from)) {
    const day = from.getDay()
    const next = new Date(from)
    // 周六 -> 下周一 +2；周日 -> 下周一 +1
    next.setDate(next.getDate() + (day === 6 ? 2 : 1))
    next.setHours(WORK_START_HOUR, WORK_START_MINUTE, 0, 0)
    return next
  }

  const todayStart = new Date(from)
  todayStart.setHours(WORK_START_HOUR, WORK_START_MINUTE, 0, 0)
  const todayEnd = new Date(from)
  todayEnd.setHours(WORK_END_HOUR, WORK_END_MINUTE, 0, 0)

  if (from < todayStart) {
    return todayStart
  }
  if (from >= todayEnd) {
    let next = addDays(from, 1)
    next.setHours(WORK_START_HOUR, WORK_START_MINUTE, 0, 0)
    while (isWeekend(next)) {
      next = addDays(next, 1)
    }
    return next
  }

  // 工作日、已在上班时间内：下次到岗为下一工作日早晨
  let next = addDays(from, 1)
  next.setHours(WORK_START_HOUR, WORK_START_MINUTE, 0, 0)
  while (isWeekend(next)) {
    next = addDays(next, 1)
  }
  return next
}

function formatHm(ms: number): string {
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  return `${h} 小时 ${m} 分`
}

function formatUntilWork(ms: number): string {
  if (ms <= 0) return '马上上班'
  const days = Math.floor(ms / 86400000)
  const rest = ms % 86400000
  const h = Math.floor(rest / 3600000)
  const m = Math.floor((rest % 3600000) / 60000)
  if (days > 0) {
    return `${days} 天 ${h} 小时 ${m} 分`
  }
  return formatHm(ms)
}

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
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  if (!now) {
    return (
      <div
        className="section-card p-4 overflow-hidden"
        style={{ borderRadius: 'var(--radius)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}
      >
        <h3 className="section-title">
          <span className="section-prompt">$</span> countdown
        </h3>
        <div className="mt-2" style={{ color: 'var(--text-muted)' }}>
          <p className="m-0">加载中...</p>
        </div>
      </div>
    )
  }

  const todayStr = toDateOnly(now)
  const workStartToday = new Date(now)
  workStartToday.setHours(WORK_START_HOUR, WORK_START_MINUTE, 0, 0)
  const workEndToday = new Date(now)
  workEndToday.setHours(WORK_END_HOUR, WORK_END_MINUTE, 0, 0)

  let workStatusText: string
  let untilWorkHint: string | null = null

  if (isWeekend(now)) {
    workStatusText = '周末休息，今日不上班'
    const nextStart = getNextWorkStart(now)
    untilWorkHint = `距离下次上班（${WORK_START_HOUR}:${String(WORK_START_MINUTE).padStart(2, '0')}）还有 ${formatUntilWork(nextStart.getTime() - now.getTime())}`
  } else if (now < workStartToday) {
    workStatusText = `距离上班还有 ${formatHm(workStartToday.getTime() - now.getTime())}`
  } else if (now < workEndToday) {
    workStatusText = `距离下班还有 ${formatHm(workEndToday.getTime() - now.getTime())}`
  } else {
    workStatusText = '已下班'
    const nextStart = getNextWorkStart(now)
    untilWorkHint = `距离下次上班（${WORK_START_HOUR}:${String(WORK_START_MINUTE).padStart(2, '0')}）还有 ${formatUntilWork(nextStart.getTime() - now.getTime())}`
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
        <p className="m-0">{workStatusText}</p>
        {untilWorkHint && <p className="m-0">{untilWorkHint}</p>}
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
