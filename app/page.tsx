'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

const EARLY_ACCESS_CAPACITY = 20

export default function LandingPage() {
  const router = useRouter()
  const [spotsUsed, setSpotsUsed] = useState<number | null>(null)

  const handleGetStarted = () => {
    router.push('/login')
  }

  // Dynamische teller: aantal approved users = early adopters
  useEffect(() => {
    const loadSpots = async () => {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_approved', true)

      if (!error && typeof count === 'number') {
        setSpotsUsed(count)
      }
    }

    loadSpots()
  }, [])

  const spotsLeft =
    spotsUsed === null ? null : Math.max(EARLY_ACCESS_CAPACITY - spotsUsed, 0)

  const spotsLabel =
    spotsUsed === null
      ? 'Checking available seats…'
      : spotsUsed >= EARLY_ACCESS_CAPACITY
      ? `Early access is full — new signups go on the waitlist.`
      : `${spotsUsed} / ${EARLY_ACCESS_CAPACITY} spots filled • ${spotsLeft} left`

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      {/* Top bar */}
      <header className="border-b border-slate-800">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-sm font-semibold text-emerald-400">
              T
            </div>
            <span className="text-sm font-semibold tracking-tight">
              Tradelyse
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <button
              onClick={() => router.push('/login')}
              className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-slate-200 hover:bg-slate-800"
            >
              Log in
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-slate-900 bg-gradient-to-b from-slate-950 to-slate-900">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-12 lg:flex-row lg:items-center">
          {/* Left side */}
          <div className="flex-1">
            {/* Early badge + spots */}
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <p className="inline-flex rounded-full border border-emerald-500/30 bg-emerald-500/5 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-emerald-300">
                Early access · Free during beta
              </p>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-slate-950/70 px-3 py-1 text-[11px] text-emerald-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{spotsLabel}</span>
              </div>
            </div>

            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
              A serious trading journal
              <span className="block text-emerald-400">
                with zero extra effort.
              </span>
            </h1>

            <p className="mt-4 max-w-xl text-sm text-slate-400">
              Tradelyse logs your trades automatically from cTrader, TradingView or
              (soon) MT4/MT5. Built for traders who want real data — not guesses.
              In early access you use Tradelyse for free, in exchange for honest
              feedback, testing and feature requests.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
              <button
                onClick={handleGetStarted}
                className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-medium text-emerald-950 shadow-sm transition hover:bg-emerald-400"
              >
                Claim early access
              </button>

              <button
                onClick={() => {
                  const el = document.getElementById('features')
                  if (el) el.scrollIntoView({ behavior: 'smooth' })
                }}
                className="rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-xs text-slate-200 hover:bg-slate-800"
              >
                See how it works
              </button>
            </div>

            <p className="mt-3 text-[11px] text-slate-500">
              No credit card required. Early adopters get free access during beta
              and a permanent discount once Tradelyse officially launches.
            </p>
          </div>

          {/* Right preview */}
          <div className="flex-1">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-xl">
              <p className="text-[11px] font-medium text-slate-400">
                Example dashboard
              </p>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <MiniStat label="Total trades" value="248" />
                <MiniStat label="Winrate" value="54.2 %" highlight />
                <MiniStat label="Avg R multiple" value="0.78" />
                <MiniStat label="Last month PnL" value="+ 3,482.00" highlight />
              </div>

              <div className="mt-5">
                <p className="mb-2 text-[11px] font-medium text-slate-400">
                  Equity curve (example)
                </p>
                <div className="h-24 w-full rounded-xl border border-slate-800 bg-slate-950/60">
                  <svg
                    viewBox="0 0 100 40"
                    preserveAspectRatio="none"
                    className="h-full w-full"
                  >
                    <rect
                      x="0"
                      y="0"
                      width="100"
                      height="40"
                      fill="transparent"
                    />
                    <line
                      x1="0"
                      y1="22"
                      x2="100"
                      y2="18"
                      stroke="#475569"
                      strokeWidth="0.4"
                      strokeDasharray="2 2"
                    />
                    <path
                      d="M0 30 L10 28 L20 26 L30 24 L40 27 L50 22 L60 20 L70 18 L80 15 L90 17 L100 13"
                      stroke="#22c55e"
                      strokeWidth="0.9"
                      fill="none"
                    />
                  </svg>
                </div>
              </div>

              <p className="mt-3 text-[11px] text-slate-500">
                Your real equity curve based on live trade data — no spreadsheets.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Early adopter deal */}
      <section className="border-b border-slate-900 bg-slate-950">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <h2 className="text-lg font-semibold text-slate-100">
            The early adopter deal.
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Tradelyse is in active development. I&apos;m looking for a small group of
            traders who want to shape the product together — and get rewarded for it.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-emerald-700/40 bg-emerald-900/10 p-4">
              <h3 className="text-sm font-semibold text-emerald-300">
                What you get
              </h3>
              <ul className="mt-2 space-y-1 text-xs text-slate-200">
                <li>• Free access during the entire beta.</li>
                <li>• A permanent discount once pricing goes live.</li>
                <li>• Priority support & direct contact with the builder.</li>
                <li>• Your requests directly influence the roadmap.</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <h3 className="text-sm font-semibold text-slate-100">
                What I ask from you
              </h3>
              <ul className="mt-2 space-y-1 text-xs text-slate-300">
                <li>• Use Tradelyse in your real or demo trading.</li>
                <li>• Share honest feedback about what works and what doesn&apos;t.</li>
                <li>• Report bugs and weird edge cases when you see them.</li>
                <li>
                  • Request new features and improvements that would make Tradelyse
                  more useful for you.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-b border-slate-900 bg-slate-950">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <h2 className="text-lg font-semibold text-slate-100">
            Built for traders who take their data seriously.
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Not another notes app — but real, reliable metrics from your broker.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <FeatureCard
              title="Automatic trade logging"
              body="Your trades are sent to Tradelyse via cTrader or (soon) MT4/MT5. No manual work, no missing trades."
            />
            <FeatureCard
              title="Deep analytics"
              body="Performance per pair, weekday, session and (in the future) per setup and strategy."
            />
            <FeatureCard
              title="Equity & profit calendar"
              body="A real equity curve and daily PnL heatmap help you spot when you're in sync — and when you're not."
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-b border-slate-900 bg-slate-950">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <h2 className="text-lg font-semibold text-slate-100">
            How it works
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            You can have your first trades flowing into Tradelyse in minutes.
          </p>

          <ol className="mt-5 grid gap-4 text-sm text-slate-300 md:grid-cols-3">
            <li className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-xs font-semibold text-emerald-300">Step 1</p>
              <p className="mt-1 font-medium">Create an account & API key</p>
              <p className="mt-2 text-xs text-slate-400">
                Log in, generate your personal API key and copy your user ID. No
                credit card required.
              </p>
            </li>

            <li className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-xs font-semibold text-emerald-300">Step 2</p>
              <p className="mt-1 font-medium">Connect your platform</p>
              <p className="mt-2 text-xs text-slate-400">
                Start with the cTrader bot or an HTTP integration. MT4/MT5 support
                is coming — early adopters get it first.
              </p>
            </li>

            <li className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-xs font-semibold text-emerald-300">Step 3</p>
              <p className="mt-1 font-medium">Trade, review, refine</p>
              <p className="mt-2 text-xs text-slate-400">
                Use dashboards, analytics and the profit calendar to tighten your
                trading plan. Share what&apos;s missing — it might be the next
                feature shipped.
              </p>
            </li>
          </ol>

          <div className="mt-6">
            <button
              onClick={handleGetStarted}
              className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-medium text-emerald-950 shadow-sm transition hover:bg-emerald-400"
            >
              Join as early adopter
            </button>
            <p className="mt-2 text-[11px] text-slate-500">
              Limited spots. When the beta fills up, new accounts will go on a
              waitlist.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 text-[11px] text-slate-500">
          <span>© {new Date().getFullYear()} Tradelyse — Early Access</span>
          <span>info@tradelyse.com</span>
        </div>
      </footer>
    </main>
  )
}

function MiniStat({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2">
      <p className="text-[10px] text-slate-400">{label}</p>
      <p
        className={`mt-1 text-sm font-semibold ${
          highlight ? 'text-emerald-400' : 'text-slate-50'
        }`}
      >
        {value}
      </p>
    </div>
  )
}

function FeatureCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
      <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
      <p className="mt-2 text-xs text-slate-400">{body}</p>
    </div>
  )
}