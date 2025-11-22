"use client"
import { useState } from "react"
import Link from "next/link"

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/trades", label: "Trades" },
  { href: "/analytics", label: "Analytics" },
  { href: "/api-keys", label: "API Keys" },
  { href: "/settings", label: "Settings" },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    // alleen zichtbaar op mobiel
    <nav className="w-full bg-slate-900 border-b border-slate-800 md:hidden">
      <div className="px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/dashboard" className="text-xl font-semibold">
          Tradelyse
        </Link>

        {/* Hamburger button */}
        <button
          className="flex items-center space-x-2"
          onClick={() => setOpen(!open)}
          aria-label="Open navigation"
        >
          <div className="space-y-1">
            <span className="block w-6 h-0.5 bg-white" />
            <span className="block w-6 h-0.5 bg-white" />
            <span className="block w-6 h-0.5 bg-white" />
          </div>
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="bg-slate-900 px-4 pb-4 space-y-3 text-slate-200">
          {navLinks.map(link => (
            <div key={link.href}>
              <Link
                href={link.href}
                onClick={() => setOpen(false)}
                className="block"
              >
                {link.label}
              </Link>
            </div>
          ))}
        </div>
      )}
    </nav>
  )
}