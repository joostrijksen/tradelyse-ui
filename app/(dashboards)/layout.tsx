// app/(dashboards)/layout.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type Props = {
  children: React.ReactNode
}

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname()
  const active = pathname === href

  return (
    <Link
      href={href}
      className={`flex items-center rounded-lg px-3 py-2 text-sm font-medium transition ${
        active
          ? 'bg-slate-800 text-slate-50'
          : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
      }`}
    >
      {label}
    </Link>
  )
}

export default function DashboardsLayout({ children }: Props) {
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const checkAdmin = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user && user.email === 'joostrijksen@me.com') {
        setIsAdmin(true)
      } else {
        setIsAdmin(false)
      }
    }

    checkAdmin()
  }, [])

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-50">
      {/* SIDEBAR */}
      <aside className="hidden w-60 flex-col border-r border-slate-800 bg-slate-950/80 p-4 md:flex">
        {/* LOGO */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-sm font-bold text-slate-950">
            T
          </div>
          <div>
            <div className="text-sm font-semibold">Tradelyse</div>
            <div className="text-xs text-slate-500">TRADE JOURNAL</div>
          </div>
        </div>

        {/* MAIN NAV */}
        <nav className="space-y-1 flex-1">
          <NavLink href="/dashboard" label="Dashboard" />
          <NavLink href="/trades" label="Trades" />
          <NavLink href="/analytics" label="Analytics" />
          <NavLink href="/api-keys" label="API Keys" />
          <NavLink href="/settings" label="Settings" />

          {/* ADMIN – alleen zichtbaar voor jouw account */}
          {isAdmin && (
            <div className="mt-4 rounded-lg border border-emerald-700/70 bg-emerald-900/20 p-2">
              <NavLink href="/admin" label="Admin · Approvals" />
            </div>
          )}

          {/* FEEDBACK SECTION */}
          <div className="mt-4 rounded-lg border border-slate-800 bg-slate-900/40 p-2">
            <NavLink href="/feedback" label="Feedback & roadmap" />
          </div>
        </nav>

        {/* FOOTER LINKS IN SIDEBAR */}
        <div className="mt-4 border-t border-slate-800 pt-3 text-[11px] text-slate-500">
          <Link href="/privacy" className="block hover:text-slate-300">
            Privacy Policy
          </Link>
          <Link href="/terms" className="mt-1 block hover:text-slate-300">
            Terms of Use
          </Link>
          <a
            href="mailto:info@tradelyse.com"
            className="mt-1 block hover:text-slate-300"
          >
            info@tradelyse.com
          </a>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 bg-slate-950/90 p-4 md:p-6">
        {/* max-w: voorkomt dat Trades / Dashboard te breed worden op grote schermen */}
        <div className="mx-auto w-full max-w-6xl">
          {children}

          {/* PAGE FOOTER */}
          <footer className="mt-10 pb-4 text-center text-[11px] text-slate-600">
            <Link href="/privacy" className="hover:text-slate-300">
              Privacy Policy
            </Link>
            {' • '}
            <Link href="/terms" className="hover:text-slate-300">
              Terms of Use
            </Link>
            {' • '}
            <a
              href="mailto:info@tradelyse.com"
              className="hover:text-slate-300"
            >
              info@tradelyse.com
            </a>
          </footer>
        </div>
      </main>
    </div>
  )
}