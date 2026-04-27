import { useState, useEffect, type ReactNode } from 'react'

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

/** 实时倒计时数字：各段用 chroma-tag--0…5 轮换，单位字用 muted */
function ColoredCountdown({ ms }: { ms: number }) {
  if (ms <= 0) {
    return (
      <>
        <span className="chroma-tag chroma-tag--0">0</span>
        <span style={{ color: 'var(--text-muted)' }}> 秒</span>
      </>
    )
  }
  const totalSeconds = Math.floor(ms / 1000)
  const sec = totalSeconds % 60
  const totalMinutes = Math.floor(totalSeconds / 60)
  const min = totalMinutes % 60
  const totalHours = Math.floor(totalMinutes / 60)
  const hour = totalHours % 24
  const days = Math.floor(totalHours / 24)

  let ci = 0
  const labelStyle = { color: 'var(--text-muted)' as const }

  const out: ReactNode[] = []
  let key = 0
  const pushNum = (n: number) => {
    const idx = ci++ % 6
    out.push(
      <span key={key++} className={`chroma-tag chroma-tag--${idx}`}>
        {n}
      </span>,
    )
  }
  const pushLabel = (s: string) => {
    out.push(
      <span key={key++} style={labelStyle}>
        {s}
      </span>,
    )
  }

  if (days > 0) {
    pushNum(days)
    pushLabel(' 天 ')
    pushNum(hour)
    pushLabel(' 小时 ')
    pushNum(min)
    pushLabel(' 分 ')
    pushNum(sec)
    pushLabel(' 秒')
  } else if (totalHours > 0) {
    pushNum(totalHours)
    pushLabel(' 小时 ')
    pushNum(min)
    pushLabel(' 分 ')
    pushNum(sec)
    pushLabel(' 秒')
  } else if (totalMinutes > 0) {
    pushNum(totalMinutes)
    pushLabel(' 分 ')
    pushNum(sec)
    pushLabel(' 秒')
  } else {
    pushNum(sec)
    pushLabel(' 秒')
  }

  return <>{out}</>
}

function UntilNextWorkCountdown({ ms }: { ms: number }) {
  if (ms <= 0) return <span style={{ color: 'var(--text-muted)' }}>马上上班</span>
  return <ColoredCountdown ms={ms} />
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

/** 自然日结束（含当日假期最后一天到 23:59:59.999） */
function endOfDateOnly(s: string): Date {
  const d = parseDateOnly(s)
  d.setHours(23, 59, 59, 999)
  return d
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
        <h3 className="section-title">倒计时</h3>
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

  let workLine: ReactNode
  let untilWorkLine: ReactNode | null = null
  const workClock = `${WORK_START_HOUR}:${String(WORK_START_MINUTE).padStart(2, '0')}`

  if (isWeekend(now)) {
    workLine = '周末休息，今日不上班'
    const nextStart = getNextWorkStart(now)
    const ms = nextStart.getTime() - now.getTime()
    untilWorkLine = (
      <>
        距离下次上班（
        <span>{workClock}</span>
        ）还有 <UntilNextWorkCountdown ms={ms} />
      </>
    )
  } else if (now < workStartToday) {
    const ms = workStartToday.getTime() - now.getTime()
    workLine = (
      <>
        距离上班还有 <ColoredCountdown ms={ms} />
      </>
    )
  } else if (now < workEndToday) {
    const ms = workEndToday.getTime() - now.getTime()
    workLine = (
      <>
        距离下班还有 <ColoredCountdown ms={ms} />
      </>
    )
  } else {
    workLine = '已下班'
    const nextStart = getNextWorkStart(now)
    const ms = nextStart.getTime() - now.getTime()
    untilWorkLine = (
      <>
        距离下次上班（
        <span>{workClock}</span>
        ）还有 <UntilNextWorkCountdown ms={ms} />
      </>
    )
  }

  const sorted = [...holidays].sort((a, b) => a.start.localeCompare(b.start))
  const pastHolidays = sorted.filter((h) => h.end < todayStr)
  const remainingHolidays = sorted.filter((h) => h.end >= todayStr)

  let holidayLine: ReactNode
  const inHoliday = sorted.find((h) => todayStr >= h.start && todayStr <= h.end)
  if (inHoliday) {
    const endAt = endOfDateOnly(inHoliday.end)
    const leftMs = endAt.getTime() - now.getTime()
    holidayLine =
      leftMs <= 0 ? (
        <>
          正在放 {inHoliday.name}，今日收尾
        </>
      ) : (
        <>
          正在放 {inHoliday.name}，还剩 <ColoredCountdown ms={leftMs} />
        </>
      )
  } else {
    const next = sorted.find((h) => h.start > todayStr)
    if (next) {
      const start = parseDateOnly(next.start)
      const ms = start.getTime() - now.getTime()
      holidayLine = (
        <>
          距离 {next.name} 还有 <ColoredCountdown ms={ms} />
        </>
      )
    } else {
      holidayLine = (
        <>
          暂无假期
        </>
      )
    }
  }

  const formatRange = (h: HolidayItem) => `${h.start.slice(5)}-${h.end.slice(5)} ${h.days}天`

  return (
    <div
      className="section-card p-4 overflow-hidden"
      style={{ borderRadius: 'var(--radius)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}
    >
      <h3 className="section-title">倒计时</h3>
      <div className="mt-2 space-y-2" style={{ color: 'var(--text-muted)' }}>
        <p className="m-0">{workLine}</p>
        {untilWorkLine && <p className="m-0">{untilWorkLine}</p>}
        <p className="m-0">{holidayLine}</p>
      </div>
      {pastHolidays.length > 0 && (
        <div className="mt-3 pt-2 border-t" style={{ borderColor: 'var(--card-border)' }}>
          <p className="m-0 mb-1" style={{ fontSize: '0.7rem' }}>已过假期</p>
          <ul className="m-0 pl-4 space-y-0.5 list-disc" style={{ color: 'var(--text-muted)' }}>
            {pastHolidays.map((h, i) => (
              <li
                key={h.name}
                style={{
                  textDecoration: 'line-through',
                  textDecorationColor: 'var(--text-muted)',
                  opacity: 0.88,
                }}
              >
                <span className={`chroma-tag chroma-tag--${i % 6}`}>{h.name}</span> {formatRange(h)}
              </li>
            ))}
          </ul>
        </div>
      )}
      {remainingHolidays.length > 0 && (
        <div className="mt-3 pt-2 border-t" style={{ borderColor: 'var(--card-border)' }}>
          <p className="m-0 mb-1" style={{ fontSize: '0.7rem' }}>剩余假期</p>
          <ul className="m-0 pl-4 space-y-0.5 list-disc" style={{ color: 'var(--text-muted)' }}>
            {remainingHolidays.map((h, i) => (
              <li key={h.name}>
                <span className={`chroma-tag chroma-tag--${i % 6}`}>{h.name}</span> {formatRange(h)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
