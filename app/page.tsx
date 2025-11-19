'use client'

import { useRouter } from 'next/navigation'

export default function LandingPage() {
  const router = useRouter()

  const handleGetStarted = () => {
    router.push('/login')
  }

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
          <div className="flex-1">
            <p className="mb-3 inline-flex rounded-full border border-emerald-500/30 bg-emerald-500/5 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-emerald-300">
              Early access • Trading journal
            </p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
              A serious trading journal
              <span className="block text-emerald-400">
                with zero extra effort.
              </span>
            </h1>
            <p className="mt-4 max-w-xl text-sm text-slate-400">
              Connect Tradelyse to your MT4, MT5, cTrader or (via n8n) TradingView
              and let every trade be logged automatically. Get real insight into
              your performance per pair, per weekday and per strategy.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
              <button
                onClick={handleGetStarted}
                className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-medium text-emerald-950 shadow-sm transition hover:bg-emerald-400"
              >
                Get early access
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
              No marketing fluff. Just hard data: PnL, R-multiples, equity curve
              and your best/worst days.
            </p>
          </div>

          {/* Hero preview card */}
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

              {/* Mini equity curve */}
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
                    <rect x="0" y="0" width="100" height="40" fill="transparent" />
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
                Your real equity curve based on live trade data from your broker,
                without copying anything into Excel.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="border-b border-slate-900 bg-slate-950"
      >
        <div className="mx-auto max-w-6xl px-4 py-10">
          <h2 className="text-lg font-semibold text-slate-100">
            Built for traders who take their data seriously.
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Not another generic note-taking app. Tradelyse is entirely focused on
            objective metrics based on your actual trades.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <FeatureCard
              title="Automatic trade logging"
              body="Trades are ingested automatically via your API key and connection with n8n / MT4 / MT5 / cTrader. No more copy-pasting tickets."
            />
            <FeatureCard
              title="Deep analytics"
              body="Break down performance by pair, weekday and (in future) strategy or setup. See exactly where your edge is — and where it isn’t."
            />
            <FeatureCard
              title="Equity & profit calendar"
              body="A real-time equity curve and daily profit calendar show you when you’re in the zone — and when you should step away."
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
            You can have your first trades flowing into Tradelyse in just a few
            minutes.
          </p>

          <ol className="mt-5 grid gap-4 text-sm text-slate-300 md:grid-cols-3">
            <li className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-xs font-semibold text-emerald-300">
                Step 1
              </p>
              <p className="mt-1 font-medium">Create an account & API key</p>
              <p className="mt-2 text-xs text-slate-400">
                Log in, go to API keys and generate your personal key. You’ll use
                this in your connector (n8n, MT4/5, cTrader, etc.).
              </p>
            </li>
            <li className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-xs font-semibold text-emerald-300">
                Step 2
              </p>
              <p className="mt-1 font-medium">Connect your trading platform</p>
              <p className="mt-2 text-xs text-slate-400">
                Send trades to the Tradelyse API. Every trade is stored with PnL,
                R multiple, pair, direction and more.
              </p>
            </li>
            <li className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-xs font-semibold text-emerald-300">
                Step 3
              </p>
              <p className="mt-1 font-medium">Review & improve</p>
              <p className="mt-2 text-xs text-slate-400">
                Use the dashboard, equity curve, profit calendar and analytics to
                tighten your plan, spot patterns and remove bad habits.
              </p>
            </li>
          </ol>

          <div className="mt-6">
            <button
              onClick={handleGetStarted}
              className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-medium text-emerald-950 shadow-sm transition hover:bg-emerald-400"
            >
              Join early access
            </button>
            <p className="mt-2 text-[11px] text-slate-500">
              Early adopters get closer support and have direct influence on the
              roadmap.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 text-[11px] text-slate-500">
          <span>© {new Date().getFullYear()} Tradelyse</span>
          <span>Built for serious traders.</span>
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