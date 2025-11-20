'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import StatCard from '@/components/StatCard'

// Trade shape (aligned with your trades table)
type Trade = {
  id: number
  pair: string | null
  direction: string | null
  entry: number | null
  sl: number | null
  tp: number | null
  size: number | null
  trade_type: string | null
  timestamp: string | null
  notes: string | null
  pnl: number | null
  pnl_percentage: number | null
  result_r: number | null
}

// For the calendar grid
type CalendarDay = {
  date: Date
  key: string
  pnl: number
  count: number
  inMonth: boolean
}

// Helper: build a date key based on local time: YYYY-MM-DD
function formatDateKeyLocal(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// Helper: parse a key back to a Date (local time)
function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

export default function DashboardPage() {
  const router = useRouter()

  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Month shown in the calendar (always first day of month)
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })

  // Selected day (YYYY-MM-DD) for the "Trades for selected day" widget
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null)

  // ====== Fetch trades ======
  useEffect(() => {
    const loadTrades = async () => {
      setLoading(true)
      setError(null)

      const { data: userData, error: userError } = await supabase.auth.getUser()

      if (userError || !userData.user) {
        router.push('/')
        return
      }

      const user = userData.user

      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: true })

      if (error) {
        setError(error.message)
      } else {
        setTrades((data || []) as Trade[])
      }

      setLoading(false)
    }

    loadTrades()
  }, [router])

  // ====== Global statistics ======
  const totalTrades = trades.length
  const totalPnl = trades.reduce((sum, t) => sum + (t.pnl ?? 0), 0)

  const winningTrades = trades.filter(t => (t.pnl ?? 0) > 0).length
  const losingTrades = trades.filter(t => (t.pnl ?? 0) < 0).length
  const winRate = totalTrades ? (winningTrades / totalTrades) * 100 : 0

  const tradesWithR = trades.filter(
    t => t.result_r !== null && t.result_r !== undefined,
  )
  const avgR =
    tradesWithR.length > 0
      ? tradesWithR.reduce((sum, t) => sum + (t.result_r ?? 0), 0) /
        tradesWithR.length
      : 0

  // ====== Equity curve ======
  const equityValues: number[] = []
  {
    let running = 0
    const sorted = [...trades]
      .filter(t => t.timestamp)
      .sort((a, b) => {
        return (
          new Date(a.timestamp as string).getTime() -
          new Date(b.timestamp as string).getTime()
        )
      })

    for (const t of sorted) {
      running += t.pnl ?? 0
      equityValues.push(running)
    }
  }

  let equityPath = ''
  if (equityValues.length > 0) {
    const maxAbs = Math.max(...equityValues.map(v => Math.abs(v))) || 1
    equityPath = equityValues
      .map((v, idx) => {
        const x =
          equityValues.length === 1
            ? 0
            : (idx / (equityValues.length - 1)) * 100
        const y = 20 - (v / maxAbs) * 15 // 20 = midline, 15 = amplitude
        const cmd = idx === 0 ? 'M' : 'L'
        return `${cmd} ${x.toFixed(2)} ${y.toFixed(2)}`
      })
      .join(' ')
  }

  // ====== Calendar data (aggregate per day) ======
  const weekdayLabels = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

  // Build map: key = 'YYYY-MM-DD' (LOCAL date)
  const byDate = new Map<string, { pnl: number; count: number }>()
  for (const t of trades) {
    if (!t.timestamp) continue
    const d = new Date(t.timestamp)
    d.setHours(0, 0, 0, 0)
    const key = formatDateKeyLocal(d)
    const current = byDate.get(key) ?? { pnl: 0, count: 0 }
    current.pnl += t.pnl ?? 0
    current.count += 1
    byDate.set(key, current)
  }

  // Compute calendar range for the current month
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const monthStart = new Date(year, month, 1)
  const monthEnd = new Date(year, month + 1, 0) // last day of month

  // Monday as week start
  const start = new Date(monthStart)
  const startWeekDay = (start.getDay() + 6) % 7 // 0 = Monday
  start.setDate(start.getDate() - startWeekDay)

  const daysInMonth = monthEnd.getDate()
  const totalCells = Math.ceil((startWeekDay + daysInMonth) / 7) * 7 // 4–6 weeks

  const days: CalendarDay[] = []
  for (let i = 0; i < totalCells; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    const key = formatDateKeyLocal(d)
    const summary = byDate.get(key) ?? { pnl: 0, count: 0 }
    days.push({
      date: d,
      key,
      pnl: summary.pnl,
      count: summary.count,
      inMonth: d.getMonth() === month,
    })
  }

  const monthLabel = currentMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  const handlePrevMonth = () => {
    setCurrentMonth(
      prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
    )
  }

  const handleNextMonth = () => {
    setCurrentMonth(
      prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
    )
  }

  // ====== Trades for selected day (right side widget) ======
  const selectedTrades =
    selectedDateKey === null
      ? []
      : trades
          .filter(t => {
            if (!t.timestamp) return false
            const d = new Date(t.timestamp)
            d.setHours(0, 0, 0, 0)
            const key = formatDateKeyLocal(d)
            return key === selectedDateKey
          })
          // newest at the top
          .sort(
            (a, b) =>
              new Date(b.timestamp as string).getTime() -
              new Date(a.timestamp as string).getTime(),
          )

  const selectedDateLabel = selectedDateKey
    ? parseDateKey(selectedDateKey).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : '—'

  // ====== Render ======
  return (
    <div className="flex flex-col gap-6">
      {/* HEADER */}
      <header className="mb-2">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-400">
          Overview of your performance.
        </p>
      </header>

      {/* 4 STAT CARDS */}
      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Total trades" value={totalTrades.toString()} />
        <StatCard
          label="Total PnL"
          value={totalPnl.toFixed(2)}
          positive={totalPnl > 0}
        />
        <StatCard
          label="Winrate"
          value={`${winRate.toFixed(1)} %`}
          sub={`${winningTrades} win / ${losingTrades} loss`}
        />
        <StatCard
          label="Average R"
          value={avgR.toFixed(2)}
          positive={avgR > 0}
        />
      </section>

      {/* EQUITY CURVE */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-medium text-slate-200">
            Equity curve (cumulative PnL)
          </h2>
          <span className="text-xs text-slate-500">
            Based on the chronological order of your trades.
          </span>
        </div>

        {loading ? (
          <div className="flex h-40 items-center justify-center text-sm text-slate-500">
            Loading…
          </div>
        ) : equityValues.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-sm text-slate-500">
            No PnL data yet.
          </div>
        ) : (
          <div className="h-40 w-full">
            <svg
              viewBox="0 0 100 40"
              preserveAspectRatio="none"
              className="h-full w-full"
            >
              <rect x="0" y="0" width="100" height="40" fill="transparent" />
              <line
                x1="0"
                y1="20"
                x2="100"
                y2="20"
                stroke="#64748b"
                strokeWidth="0.3"
                strokeDasharray="2 2"
              />
              <path
                d={equityPath}
                stroke={totalPnl >= 0 ? '#22c55e' : '#ef4444'}
                strokeWidth="0.8"
                fill="none"
              />
            </svg>
          </div>
        )}
      </section>

      {/* ROW: LEFT CALENDAR, RIGHT EVALUATION + TRADES FOR DAY */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        {/* PROFIT CALENDAR */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-medium text-slate-200">
                Profit calendar (recent weeks)
              </h2>

              <div className="flex items-center gap-1 rounded-full border border-slate-700/70 bg-slate-900/80 px-2 py-1 text-[11px] text-slate-200">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="rounded-full px-2 py-0.5 text-slate-400 hover:bg-slate-800"
                >
                  ‹
                </button>
                <span className="px-1">{monthLabel}</span>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="rounded-full px-2 py-0.5 text-slate-400 hover:bg-slate-800"
                >
                  ›
                </button>
              </div>
            </div>

            <span className="text-xs text-slate-500">
              Top: date (DD/MM) · Center: PnL · Bottom: trade count · Click a
              day to view its trades.
            </span>
          </div>

          {loading ? (
            <div className="flex h-40 items-center justify-center text-sm text-slate-500">
              Loading…
            </div>
          ) : (
            <div className="space-y-2 text-[11px]">
              {/* Weekday labels */}
              <div className="grid grid-cols-7 gap-1 px-1">
                {weekdayLabels.map((label, idx) => (
                  <div
                    key={`weekday-${idx}`}
                    className="text-center font-medium uppercase tracking-wide text-slate-500"
                  >
                    {label}
                  </div>
                ))}
              </div>

              {/* Calendar cells */}
              <div className="grid grid-cols-7 gap-1">
                {days.map((day, index) => {
                  const dateLabel = day.date.toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                  })

                  const hasTrades = day.count > 0
                  const isSelected = selectedDateKey === day.key

                  let bg = day.inMonth
                    ? 'bg-slate-900/60 border-slate-800'
                    : 'bg-slate-900/40 border-slate-900/40'

                  if (hasTrades && day.pnl > 0) {
                    bg = 'bg-emerald-500/20 border-emerald-500/60'
                  } else if (hasTrades && day.pnl < 0) {
                    bg = 'bg-red-500/20 border-red-500/60'
                  }

                  const ring = isSelected ? 'ring-1 ring-emerald-400' : ''

                  return (
                    <button
                      key={day.key + '-' + index}
                      type="button"
                      onClick={() => setSelectedDateKey(day.key)}
                      className={`flex aspect-square flex-col rounded-xl border px-2 py-1 text-[11px] transition ${
                        hasTrades
                          ? 'cursor-pointer hover:border-emerald-400/80'
                          : 'cursor-default'
                      } ${bg} ${ring}`}
                    >
                      {/* Date (top-left) */}
                      <div className="mb-1 flex items-center justify-between text-[10px] text-slate-400">
                        <span>{dateLabel}</span>
                      </div>

                      {/* Center: PnL + trade count */}
                      <div className="flex flex-1 flex-col items-center justify-center text-center">
                        <div className="text-sm font-semibold text-slate-100">
                          {hasTrades ? day.pnl.toFixed(1) : ''}
                        </div>
                        <div className="mt-0.5 text-[11px] text-slate-300">
                          {hasTrades
                            ? `${day.count} trade${day.count !== 1 ? 's' : ''}`
                            : '–'}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </section>

        {/* RIGHT: evaluation + trades of selected day */}
        <aside className="flex flex-col gap-4">
          {/* Evaluation */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 text-sm">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Evaluation
            </h2>

            <div className="space-y-1">
              <Row label="Total trades" value={totalTrades.toString()} />
              <Row label="Winning trades" value={winningTrades.toString()} />
              <Row label="Losing trades" value={losingTrades.toString()} />
              <Row label="Winrate" value={`${winRate.toFixed(1)} %`} />
              <Row label="Average R" value={avgR.toFixed(2)} />
              <Row
                label="Total PnL"
                value={totalPnl.toFixed(2)}
                highlight={totalPnl !== 0}
                positive={totalPnl > 0}
              />
            </div>
          </section>

          {/* Trades of selected day */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 text-sm">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Trades for selected day
              </h2>
              <span className="text-[11px] text-slate-500">
                {selectedDateLabel}
              </span>
            </div>

            {selectedTrades.length === 0 ? (
              <p className="text-xs text-slate-500">No trades on this day.</p>
            ) : (
              <div className="max-h-64 space-y-1 overflow-y-auto text-xs">
                <div className="grid grid-cols-[60px,1fr,70px,50px] gap-1 border-b border-slate-800 pb-1 text-[10px] uppercase text-slate-500">
                  <span>Time</span>
                  <span>Pair</span>
                  <span>PnL</span>
                  <span>R</span>
                </div>
                {selectedTrades.map(trade => {
                  const timeLabel = trade.timestamp
                    ? new Date(trade.timestamp).toLocaleTimeString('en-GB', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : ''

                  const pnl = trade.pnl ?? 0
                  const pnlColor =
                    pnl > 0
                      ? 'text-emerald-400'
                      : pnl < 0
                      ? 'text-red-400'
                      : 'text-slate-100'

                  return (
                    <div
                      key={trade.id}
                      className="grid grid-cols-[60px,1fr,70px,50px] items-center gap-1 rounded-md px-1 py-0.5 hover:bg-slate-800/60"
                    >
                      <span className="text-[11px] text-slate-400">
                        {timeLabel}
                      </span>
                      <span className="text-[11px] text-slate-100">
                        {trade.pair}
                      </span>
                      <span className={`text-[11px] ${pnlColor}`}>
                        {pnl.toFixed(2)}
                      </span>
                      <span className="text-[11px] text-slate-100">
                        {trade.result_r !== null && trade.result_r !== undefined
                          ? trade.result_r.toFixed(2)
                          : '-'}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </aside>
      </div>

      {error && (
        <p className="text-xs text-red-400">
          Error while fetching trades: {error}
        </p>
      )}
    </div>
  )
}

// Small helper for rows in the Evaluation section
function Row(props: {
  label: string
  value: string
  highlight?: boolean
  positive?: boolean
}) {
  const { label, value, highlight, positive } = props
  const color = !highlight
    ? 'text-slate-100'
    : positive
    ? 'text-emerald-400'
    : 'text-red-400'

  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-slate-400">{label}</span>
      <span className={color}>{value}</span>
    </div>
  )
}