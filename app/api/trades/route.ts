// app/api/trades/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { authenticateApiKey } from '@/lib/authApiKey'

// Type van een trade payload zoals n8n 'm stuurt
type IncomingTrade = {
  timestamp?: string
  pair: string
  direction: 'long' | 'short'
  entry: number
  sl: number | null
  tp: number | null
  size: number | null
  trade_type: string | null // bijv. 'scalp', 'swing', 'auto'
  pnl: number | null
  pnl_percentage: number | null
  result_r: number | null
  notes: string | null
}

/**
 * POST /api/trades
 * Slaat een trade op voor de gebruiker die bij de API key hoort.
 */
export async function POST(req: NextRequest) {
  // 1. API key controleren
  const ctx = await authenticateApiKey(req)

  if (!ctx) {
    return NextResponse.json(
      { error: 'Invalid or missing API key' },
      { status: 401 }
    )
  }

  // 2. Body parsen
  let body: IncomingTrade
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  if (!body.pair || !body.direction || !body.entry) {
    return NextResponse.json(
      { error: 'pair, direction en entry zijn verplicht' },
      { status: 400 }
    )
  }

  const timestamp =
    body.timestamp ?? new Date().toISOString()

  // 3. Trade wegschrijven
  const { error } = await supabaseAdmin.from('trades').insert({
    user_id: ctx.userId,
    timestamp,
    pair: body.pair,
    direction: body.direction,
    entry: body.entry,
    sl: body.sl,
    tp: body.tp,
    size: body.size,
    trade_type: body.trade_type,
    pnl: body.pnl,
    pnl_percentage: body.pnl_percentage,
    result_r: body.result_r,
    notes: body.notes,
  })

  if (error) {
    console.error('Error inserting trade', error)
    return NextResponse.json(
      { error: 'Could not store trade' },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true })
}

/**
 * GET /api/trades?limit=50
 * Haalt trades op voor de gebruiker van de API key.
 * Handig om te testen vanuit n8n of Hoppscotch.
 */
export async function GET(req: NextRequest) {
  const ctx = await authenticateApiKey(req)

  if (!ctx) {
    return NextResponse.json(
      { error: 'Invalid or missing API key' },
      { status: 401 }
    )
  }

  const limitParam = req.nextUrl.searchParams.get('limit')
  const limit = limitParam ? Math.min(Number(limitParam) || 50, 200) : 50

  const { data, error } = await supabaseAdmin
    .from('trades')
    .select('*')
    .eq('user_id', ctx.userId)
    .order('timestamp', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching trades', error)
    return NextResponse.json(
      { error: 'Could not fetch trades' },
      { status: 500 }
    )
  }

  return NextResponse.json({ trades: data })
}