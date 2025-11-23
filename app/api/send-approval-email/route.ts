import { NextResponse } from 'next/server'

export async function POST() {
  // Mailfunctie uitgezet – altijd "ok" teruggeven
  return NextResponse.json({ ok: true })
}