'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import StatCard from '@/app/components/StatCard'

type Trade = {
  id: number
  user_id: string | null
  timestamp: string | null
  pair: string | null
  direction: string | null
  entry: number | null
  sl: number | null
  tp: number | null
  size: number | null
  trade_type: string | null
  pnl: number | null
  pnl_percentage: number | null
  result_r: number | null
  notes: string | null
}

type PairStats = {
  pair: string
  trades: number
  wins: number
  pnl: number
  winrate: number
}

type DayStats = {
  weekday: string
  trades: number
  wins: number
  pnl: number
  winrate: number
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function AnalyticsPage() {
  const router = useRouter()
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)

      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser()

      if (userErr || !user) {
        router.push('/')
        return
      }

      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false })

      if (error) {
        console.error(error)
      } else {
        setTrades(data ?? [])
      }

      setLoading(false)
    }

    load()
  }, [router])

  const totalTrades = trades.length
  const winningTrades = trades.filter(t => (t.pnl ?? 0) > 0).length
  const losingTrades = trades.filter(t => (t.pnl ?? 0) < 0).length
  const breakevenTrades =
    totalTrades - winningTrades - losingTrades

  const winRate =
    totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0

  const rValues = trades.map(t => t.result_r).filter(r => r !== null) as number[]
  const avgR =
    rValues.length > 0
      ? rValues.reduce((sum, r) => sum + r, 0) / rValues.length
      : 0

  const longTrades = trades.filter(t => t.direction === 'long').length
  const shortTrades = trades.filter(t => t.direction === 'short').length
  const longShortTotal = longTrades + shortTrades || 1
  const longPct = (longTrades / longShortTotal) * 100
  const shortPct = (shortTrades / longShortTotal) * 100

  // ====== Per pair ======
  const pairMap = new Map<string, PairStats>()

  for (const t of trades) {
    const pair = (t.pair ?? 'Unknown').toUpperCase()
    if (!pairMap.has(pair)) {
      pairMap.set(pair, {
        pair,
        trades: 0,
        wins: 0,
        pnl: 0,
        winrate: 0,
      })
    }
    const entry = pairMap.get(pair)!
    entry.trades += 1
    if ((t.pnl ?? 0) > 0) entry.wins += 1
    entry.pnl += t.pnl ?? 0
  }

  const pairStats: PairStats[] = Array.from(pairMap.values())
    .map(p => ({
      ...p,
      winrate: p.trades > 0 ? (p.wins / p.trades) * 100 : 0,
    }))
    .sort((a, b) => b.trades - a.trades)

  // ====== Per weekday ======
  const dayMap = new Map<number, DayStats>()

  for (const t of trades) {
    if (!t.timestamp) continue
    const d = new Date(t.timestamp)
    const idx = d.getDay() // 0-6
    if (!dayMap.has(idx)) {
      dayMap.set(idx, {
        weekday: WEEKDAY_LABELS[idx],
        trades: 0,
        wins: 0,
        pnl: 0,
        winrate: 0,
      })
    }
    const entry = dayMap.get(idx)!
    entry.trades += 1
    if ((t.pnl ?? 0) > 0) entry.wins += 1
    entry.pnl += t.pnl ?? 0
  }

  const dayStats: DayStats[] = Array.from(dayMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([, v]) => ({
      ...v,
      winrate: v.trades > 0 ? (v.wins / v.trades) * 100 : 0,
    }))

  return (
    <div className="flex flex-col gap-6">
      <header className="mb-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Analytics
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          In-depth statistics about your trading: by pair, by weekday, and your long/short distribution.
        </p>
      </header>

      {/* Stat cards */}
      <section className="grid gap-4 md:grid-cols-4">
        <StatCard
          label="Total trades"
          value={totalTrades.toString()}
        />
        <StatCard
          label="Winrate"
          value={`${winRate.toFixed(1)} %`}
          sub={`${winningTrades} win / ${losingTrades} loss / ${breakevenTrades} BE`}
        />
        <StatCard
          label="Avarage R"
          value={avgR.toFixed(2)}
          positive={avgR >= 0}
        />
        <StatCard
          label="Long vs short"
          value={`${longTrades} / ${shortTrades}`}
          sub={`${longPct.toFixed(0)} % long • ${shortPct.toFixed(
            0,
          )} % short`}
        />
      </section>

      {loading ? (
        <div className="mt-8 flex h-40 items-center justify-center text-sm text-slate-500">
          Laden…
        </div>
      ) : totalTrades === 0 ? (
        <div className="mt-8 flex h-40 items-center justify-center text-sm text-slate-500">
          Nog geen trades om te analyseren. Voeg eerst trades toe in
          het Trades-scherm.
        </div>
      ) : (
        <>
          {/* Long / short verdeling */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
            <h2 className="mb-3 text-sm font-medium text-slate-200">
              Long / short distribution
            </h2>
            <p className="mb-4 text-xs text-slate-500">
              Quick overview of your long/short distribution. This is purely quantitative and not weighted by PnL.
            </p>

            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex items-center justify-between">
                <span>Long trades</span>
                <span>
                  {longTrades} ({longPct.toFixed(1)}%)
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: `${longPct}%` }}
                />
              </div>

              <div className="mt-3 flex items-center justify-between">
                <span>Short trades</span>
                <span>
                  {shortTrades} ({shortPct.toFixed(1)}%)
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-red-500"
                  style={{ width: `${shortPct}%` }}
                />
              </div>
            </div>
          </section>

          {/* Performance per pair */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/70">
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
              <div>
                <h2 className="text-sm font-medium text-slate-200">
                  Performance per pair
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Winrate and PnL per currency pair. Useful for identifying which pairs perform best for you.
                </p>
              </div>
            </div>

            {pairStats.length === 0 ? (
              <div className="flex h-32 items-center justify-center text-sm text-slate-500">
                Geen data per pair beschikbaar.
              </div>
            ) : (
              <div className="max-h-[320px] overflow-auto">
                <table className="min-w-full text-left text-xs">
                  <thead className="sticky top-0 bg-slate-900">
                    <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wide text-slate-500">
                      <th className="px-6 py-3">Pair</th>
                      <th className="px-3 py-3">Trades</th>
                      <th className="px-3 py-3">Winrate</th>
                      <th className="px-3 py-3">W / L</th>
                      <th className="px-6 py-3">Total PnL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {pairStats.map(p => {
                      const pnlColor =
                        p.pnl > 0
                          ? 'text-emerald-400'
                          : p.pnl < 0
                          ? 'text-red-400'
                          : 'text-slate-200'
                      const losses = p.trades - p.wins
                      return (
                        <tr
                          key={p.pair}
                          className="text-[11px] text-slate-200"
                        >
                          <td className="px-6 py-2">{p.pair}</td>
                          <td className="px-3 py-2">{p.trades}</td>
                          <td className="px-3 py-2">
                            {p.winrate.toFixed(1)} %
                          </td>
                          <td className="px-3 py-2">
                            {p.wins} / {losses}
                          </td>
                          <td className={`px-6 py-2 ${pnlColor}`}>
                            {p.pnl.toFixed(2)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Performance per weekdag */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/70">
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
              <div>
                <h2 className="text-sm font-medium text-slate-200">
                  Performance per weekday
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Provides insight into whether certain days tend to be consistently better or worse for you.
                </p>
              </div>
            </div>

            {dayStats.length === 0 ? (
              <div className="flex h-32 items-center justify-center text-sm text-slate-500">
                No weekday data available.
              </div>
            ) : (
              <div className="max-h-[280px] overflow-auto">
                <table className="min-w-full text-left text-xs">
                  <thead className="sticky top-0 bg-slate-900">
                    <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wide text-slate-500">
                      <th className="px-6 py-3">Dag</th>
                      <th className="px-3 py-3">Trades</th>
                      <th className="px-3 py-3">Winrate</th>
                      <th className="px-3 py-3">W / L</th>
                      <th className="px-6 py-3">Total PnL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {dayStats.map(d => {
                      const losses = d.trades - d.wins
                      const pnlColor =
                        d.pnl > 0
                          ? 'text-emerald-400'
                          : d.pnl < 0
                          ? 'text-red-400'
                          : 'text-slate-200'
                      return (
                        <tr
                          key={d.weekday}
                          className="text-[11px] text-slate-200"
                        >
                          <td className="px-6 py-2">{d.weekday}</td>
                          <td className="px-3 py-2">{d.trades}</td>
                          <td className="px-3 py-2">
                            {d.winrate.toFixed(1)} %
                          </td>
                          <td className="px-3 py-2">
                            {d.wins} / {losses}
                          </td>
                          <td className={`px-6 py-2 ${pnlColor}`}>
                            {d.pnl.toFixed(2)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}