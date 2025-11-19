'use client'

import { useEffect, useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import StatCard from '@/components/StatCard'

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

type NewTradeForm = {
  pair: string
  direction: 'long' | 'short'
  entry: string
  sl: string
  tp: string
  size: string
  trade_type: string
  pnl: string
  pnl_percentage: string
  result_r: string
  notes: string
}

const initialForm: NewTradeForm = {
  pair: 'EURUSD',
  direction: 'long',
  entry: '',
  sl: '',
  tp: '',
  size: '0.5',
  trade_type: 'manual',
  pnl: '',
  pnl_percentage: '',
  result_r: '',
  notes: '',
}

function formatDateTime(value: string | null) {
  if (!value) return '—'
  const d = new Date(value)
  return d.toLocaleString('nl-NL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export default function TradesPage() {
  const router = useRouter()

  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)

  const [form, setForm] = useState<NewTradeForm>(initialForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)

  // ====== Data ophalen ======
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

  // ====== Stats ======
  const totalTrades = trades.length
  const totalPnl = trades.reduce((sum, t) => sum + (t.pnl ?? 0), 0)
  const lastTrade = trades[0] ?? null
  const lastTradeDate = lastTrade?.timestamp ?? null

  // ====== Form helpers ======
  const handleChange = (
    field: keyof NewTradeForm,
    value: string,
  ) => {
    setForm(prev => ({
      ...prev,
      [field]: value,
    }))
    setFormError(null)
    setFormSuccess(null)
  }

  const parseNumber = (value: string): number | null => {
    if (!value.trim()) return null
    const v = Number(value.replace(',', '.'))
    return Number.isNaN(v) ? null : v
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setFormSuccess(null)

    const {
      pair,
      direction,
      entry,
      sl,
      tp,
      size,
      trade_type,
      pnl,
      pnl_percentage,
      result_r,
      notes,
    } = form

    if (!pair.trim()) {
      setFormError('Vul een pair in.')
      return
    }
    if (!entry.trim() || !sl.trim() || !tp.trim()) {
      setFormError('Entry, SL en TP zijn verplicht.')
      return
    }

    const entryNum = parseNumber(entry)
    const slNum = parseNumber(sl)
    const tpNum = parseNumber(tp)
    const sizeNum = parseNumber(size) ?? 0.5
    const pnlNum = parseNumber(pnl)
    const pnlPercNum = parseNumber(pnl_percentage)
    const rNum = parseNumber(result_r)

    if (entryNum === null || slNum === null || tpNum === null) {
      setFormError('Controleer of Entry, SL en TP geldige nummers zijn.')
      return
    }

    setSaving(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setSaving(false)
      router.push('/')
      return
    }

    const { data, error } = await supabase
      .from('trades')
      .insert({
        user_id: user.id,
        pair: pair.trim(),
        direction,
        entry: entryNum,
        sl: slNum,
        tp: tpNum,
        size: sizeNum,
        trade_type: trade_type.trim(),
        pnl: pnlNum,
        pnl_percentage: pnlPercNum,
        result_r: rNum,
        notes: notes.trim() || null,
      })
      .select('*')
      .single()

    if (error) {
      console.error(error)
      setFormError('Save failed. Please try again.')
    } else if (data) {
      setTrades(prev => [data, ...prev])
      setForm(initialForm)
      setFormSuccess('Save trade.')
    }

    setSaving(false)
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="mb-2">
        <h1 className="text-2xl font-semibold tracking-tight">Trades</h1>
        <p className="mt-1 text-sm text-slate-400">
          Overview of all your trades.
        </p>
      </header>

      {/* Stat cards */}
      <section className="grid gap-4 lg:grid-cols-3">
        <StatCard label="Total trades" value={totalTrades.toString()} />
        <StatCard
          label="Total PnL"
          value={totalPnl.toFixed(2)}
          positive={totalPnl >= 0}
        />
        <StatCard
          label="Laatste trade"
          value={lastTradeDate ? formatDateTime(lastTradeDate) : '—'}
          sub={lastTrade?.pair ?? undefined}
        />
      </section>

      {/* Nieuwe trade toevoegen */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-medium text-slate-200">
              Add new trade
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Manually added trades are treated the same as n8n-synced trades in your dashboards.Handmatig ingevoerde trades worden net als de n8n-trades gebruikt in je
              dashboards.
            </p>
          </div>
          <p className="text-xs text-slate-500 text-right hidden sm:block">
            Saved to your personal journal based on your account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400">
                Pair (e.g. EURUSD)
              </label>
              <input
                className="h-9 w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 text-sm text-slate-100 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                placeholder="EURUSD"
                value={form.pair}
                onChange={e => handleChange('pair', e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400">
                Direction (long/short)
              </label>
              <select
                className="h-9 w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 text-sm text-slate-100 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                value={form.direction}
                onChange={e =>
                  handleChange('direction', e.target.value as 'long' | 'short')
                }
              >
                <option value="long">long</option>
                <option value="short">short</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400">Entry</label>
              <input
                className="h-9 w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 text-sm text-slate-100 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                placeholder="1.0850"
                value={form.entry}
                onChange={e => handleChange('entry', e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400">Size (lot)</label>
              <input
                className="h-9 w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 text-sm text-slate-100 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                placeholder="0.50"
                value={form.size}
                onChange={e => handleChange('size', e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400">SL</label>
              <input
                className="h-9 w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 text-sm text-slate-100 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                placeholder="1.0800"
                value={form.sl}
                onChange={e => handleChange('sl', e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400">TP</label>
              <input
                className="h-9 w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 text-sm text-slate-100 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                placeholder="1.0950"
                value={form.tp}
                onChange={e => handleChange('tp', e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400">
                Type (scalp/swing/day)
              </label>
              <input
                className="h-9 w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 text-sm text-slate-100 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                placeholder="manual / auto / swing / scalp…"
                value={form.trade_type}
                onChange={e => handleChange('trade_type', e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400">
                PnL (optional)
              </label>
              <input
                className="h-9 w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 text-sm text-slate-100 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                placeholder="e.g. 12.34"
                value={form.pnl}
                onChange={e => handleChange('pnl', e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400">
                PnL % (optional)
              </label>
              <input
                className="h-9 w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 text-sm text-slate-100 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                placeholder="e.g.. 1.2"
                value={form.pnl_percentage}
                onChange={e => handleChange('pnl_percentage', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400">
                R-result (optional)
              </label>
              <input
                className="h-9 w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 text-sm text-slate-100 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                placeholder="e.g. 0.5"
                value={form.result_r}
                onChange={e => handleChange('result_r', e.target.value)}
              />
            </div>
            <div className="space-y-1 md:col-span-1">
              <label className="text-xs font-medium text-slate-400">
                Notes (optional)
              </label>
              <input
                className="h-9 w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 text-sm text-slate-100 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                placeholder="Reason for taking the trade"
                value={form.notes}
                onChange={e => handleChange('notes', e.target.value)}
              />
            </div>
          </div>

          {formError && (
            <p className="text-xs text-red-400">{formError}</p>
          )}
          {formSuccess && (
            <p className="text-xs text-emerald-400">{formSuccess}</p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="mt-2 inline-flex w-full items-center justify-center rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-emerald-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Save…' : 'Save trade'}
          </button>
        </form>
      </section>

      {/* Alle trades */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/70">
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div>
            <h2 className="text-sm font-medium text-slate-200">All trades</h2>
            <p className="mt-1 text-xs text-slate-500">
              {totalTrades === 0
                ? 'NNo trades in your journal yet.'
                : `${totalTrades} trades in your journal.`}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex h-32 items-center justify-center text-sm text-slate-500">
            Laden…
          </div>
        ) : totalTrades === 0 ? (
          <div className="flex h-32 items-center justify-center text-sm text-slate-500">
            Voeg hierboven je eerste trade toe.
          </div>
        ) : (
          <div className="max-h-[480px] overflow-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="sticky top-0 bg-slate-900">
                <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wide text-slate-500">
                  <th className="px-6 py-3">Datum</th>
                  <th className="px-3 py-3">Pair</th>
                  <th className="px-3 py-3">Dir</th>
                  <th className="px-3 py-3">Entry</th>
                  <th className="px-3 py-3">SL</th>
                  <th className="px-3 py-3">TP</th>
                  <th className="px-3 py-3">Size</th>
                  <th className="px-3 py-3">Type</th>
                  <th className="px-3 py-3">PnL</th>
                  <th className="px-3 py-3">PnL %</th>
                  <th className="px-3 py-3">R</th>
                  <th className="px-6 py-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {trades.map(trade => {
                  const isLong = trade.direction === 'long'
                  const pnl = trade.pnl ?? 0
                  const pnlColor =
                    pnl > 0
                      ? 'text-emerald-400'
                      : pnl < 0
                      ? 'text-red-400'
                      : 'text-slate-200'

                  return (
                    <tr key={trade.id} className="text-[11px] text-slate-200">
                      <td className="whitespace-nowrap px-6 py-2">
                        {formatDateTime(trade.timestamp)}
                      </td>
                      <td className="px-3 py-2">{trade.pair ?? '—'}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            isLong
                              ? 'bg-emerald-500/10 text-emerald-300'
                              : 'bg-red-500/10 text-red-300'
                          }`}
                        >
                          {trade.direction ?? '—'}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        {trade.entry !== null ? trade.entry.toFixed(4) : '—'}
                      </td>
                      <td className="px-3 py-2">
                        {trade.sl !== null ? trade.sl.toFixed(4) : '—'}
                      </td>
                      <td className="px-3 py-2">
                        {trade.tp !== null ? trade.tp.toFixed(4) : '—'}
                      </td>
                      <td className="px-3 py-2">
                        {trade.size !== null ? trade.size.toFixed(2) : '—'}
                      </td>
                      <td className="px-3 py-2">
                        {trade.trade_type ?? '—'}
                      </td>
                      <td className={`px-3 py-2 ${pnlColor}`}>
                        {trade.pnl !== null ? trade.pnl.toFixed(2) : '—'}
                      </td>
                      <td className="px-3 py-2">
                        {trade.pnl_percentage !== null
                          ? `${trade.pnl_percentage.toFixed(2)}`
                          : '—'}
                      </td>
                      <td className="px-3 py-2">
                        {trade.result_r !== null
                          ? trade.result_r.toFixed(2)
                          : '—'}
                      </td>
                      <td className="px-6 py-2 max-w-xs truncate">
                        {trade.notes ?? '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}