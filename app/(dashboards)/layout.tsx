// app/(dashboards)/layout.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

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
  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-50">
      {/* SIDEBAR */}
      <aside className="hidden w-60 flex-col border-r border-slate-800 bg-slate-950/80 p-4 md:flex">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-sm font-bold text-slate-950">
            T
          </div>
          <div>
            <div className="text-sm font-semibold">Tradelyse</div>
            <div className="text-xs text-slate-500">TRADE JOURNAL</div>
          </div>
        </div>

        <nav className="space-y-1">
          <NavLink href="/dashboard" label="Dashboard" />
          <NavLink href="/trades" label="Trades" />
          <NavLink href="/analytics" label="Analytics" />
          <NavLink href="/api-keys" label="API Keys" />
          <NavLink href="/settings" label="Settings" />
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 bg-slate-950/90 p-4 md:p-6">{children}</main>
    </div>
  )
}