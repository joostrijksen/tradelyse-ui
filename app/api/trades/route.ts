// app/api/trades/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

// ---- Types ----
type IncomingTrade = {
  pair?: string
  direction?: 'long' | 'short'
  entry?: number
  exit_price?: number | null
  sl?: number | null
  tp?: number | null
  size?: number | null
  trade_type?: string | null

  // extended fields
  pnl?: number | null
  pnl_percentage?: number | null
  result_r?: number | null
  notes?: string | null

  platform?: string | null
  strategy?: string | null
  account_id?: string | null
  ticket?: string | null
  status?: 'opened' | 'closed' | string | null

  open_time?: string | null
  close_time?: string | null

  pnl_currency?: string | null
  commission?: number | null
  swap?: number | null
}

// ---- helpers ----
async function getUserIdFromApiKey(apiKey: string) {
  const { data, error } = await supabaseAdmin
    .from('api_keys')
    .select('user_id, revoked_at')
    .eq('key', apiKey)
    .maybeSingle()

  if (error || !data) return null
  if (data.revoked_at) return null

  return data.user_id as string
}

function cleanNumber(v: unknown): number | null {
  if (v === null || v === undefined) return null
  if (typeof v === 'number') return Number.isNaN(v) ? null : v
  if (typeof v === 'string') {
    const n = Number(v)
    return Number.isNaN(n) ? null : n
  }
  return null
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get('x-api-key') || req.headers.get('authorization')

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing API key' },
        { status: 401 },
      )
    }

    const userId = await getUserIdFromApiKey(apiKey.trim())
    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid or revoked API key' },
        { status: 401 },
      )
    }

    const body = (await req.json()) as IncomingTrade

    const nowIso = new Date().toISOString()
    const status = (body.status || 'closed') as IncomingTrade['status']
    const platform = body.platform || 'ctrader'
    const ticket = body.ticket || null

    // Common fields for insert / update
    const baseData = {
      pair: body.pair ?? null,
      direction: body.direction ?? null,
      entry: cleanNumber(body.entry),
      sl: cleanNumber(body.sl),
      tp: cleanNumber(body.tp),
      size: cleanNumber(body.size),
      trade_type: body.trade_type ?? null,
      notes: body.notes ?? null,
      platform,
      strategy: body.strategy ?? null,
      account_id: body.account_id ?? null,
      ticket,
      status: status ?? null,
      open_time: body.open_time ?? null,
      close_time: body.close_time ?? null,
      exit_price: cleanNumber(body.exit_price),
      pnl: cleanNumber(body.pnl),
      pnl_percentage: cleanNumber(body.pnl_percentage),
      result_r: cleanNumber(body.result_r),
      pnl_currency: body.pnl_currency ?? null,
      commission: cleanNumber(body.commission),
      swap: cleanNumber(body.swap),
    }

    // Use open_time as timestamp if present, otherwise close_time, otherwise now
    const timestamp =
      body.open_time ??
      body.close_time ??
      nowIso

    // ---- Logic: opened vs closed ----

    if (status === 'closed' && ticket) {
      // Try to find existing trade for this user + ticket + platform
      const { data: existing, error: findError } = await supabaseAdmin
        .from('trades')
        .select('id')
        .eq('user_id', userId)
        .eq('ticket', ticket)
        .eq('platform', platform)
        .order('timestamp', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (findError) {
        console.error('find existing trade error', findError)
      }

      if (existing) {
        // Update existing row with closing info
        const { error: updateError } = await supabaseAdmin
          .from('trades')
          .update({
            ...baseData,
            timestamp,
          })
          .eq('id', existing.id)

        if (updateError) {
          console.error('update trade error', updateError)
          return NextResponse.json(
            { error: 'Failed to update trade' },
            { status: 500 },
          )
        }

        return NextResponse.json({ ok: true, mode: 'updated' })
      }

      // No existing row found: fall through to insert a full closed trade
    }

    // For first-time "opened" events OR closed-without-existing → insert new row
    const { error: insertError } = await supabaseAdmin
      .from('trades')
      .insert({
        user_id: userId,
        timestamp,
        ...baseData,
      })

    if (insertError) {
      console.error('insert trade error', insertError)
      return NextResponse.json(
        { error: 'Failed to insert trade' },
        { status: 500 },
      )
    }

    return NextResponse.json({ ok: true, mode: 'inserted' })
  } catch (err) {
    console.error('trades endpoint error', err)
    return NextResponse.json(
      { error: 'Unexpected server error' },
      { status: 500 },
    )
  }
}