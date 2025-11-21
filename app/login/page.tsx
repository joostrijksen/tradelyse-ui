'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type Mode = 'login' | 'signup'

const EARLY_ACCESS_CAPACITY = 20

export default function AuthPage() {
  const router = useRouter()

  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [agree, setAgree] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [spotsUsed, setSpotsUsed] = useState<number | null>(null)

  // Load spots
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email || !password) {
      setError('Please enter both your email and password.')
      return
    }

    if (mode === 'signup' && !agree) {
      setError('You must agree to the early-access testing commitment.')
      return
    }

    setLoading(true)

    try {
      if (mode === 'signup') {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        })

        if (signUpError) {
          setError(signUpError.message)
          return
        }

        router.push('/pending-approval')
      } else {
        const { data: authData, error: signInError } =
          await supabase.auth.signInWithPassword({
            email,
            password,
          })

        if (signInError) {
          setError(signInError.message)
          return
        }

        const { data: profileData } = await supabase
          .from('profiles')
          .select('is_approved')
          .eq('id', authData.user!.id)
          .maybeSingle()

        if (!profileData?.is_approved) {
          router.push('/pending-approval')
          return
        }

        router.push('/dashboard')
      }
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-xl">
        {/* Logo / title */}
        <div className="mb-4 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
            T
          </div>
          <h1 className="text-xl font-semibold text-slate-50">
            Tradelyse
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            {mode === 'login'
              ? 'Access your private beta account.'
              : 'Apply for early access (private beta).'}
          </p>
        </div>

        {/* Counter */}
        <div className="mb-5 flex items-center justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-slate-950/60 px-3 py-1 text-[11px] text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{spotsLabel}</span>
          </div>
        </div>

        {/* Early access box (only signup) */}
        {mode === 'signup' && (
          <div className="mb-6 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-300">
            <p className="font-medium text-amber-200">
              🚀 Early Access (Private Beta)
            </p>
            <p className="mt-1">
              Only serious traders are accepted. During the beta you agree to:
            </p>
            <ul className="mt-1 list-disc pl-5">
              <li>Test Tradelyse in real or demo trading</li>
              <li>Provide feedback & feature requests</li>
              <li>Report bugs & weird edge cases</li>
              <li>Help shape the roadmap</li>
            </ul>
          </div>
        )}

        {/* Tabs login / signup */}
        <div className="mb-6 flex rounded-full bg-slate-800/60 p-1 text-xs font-medium text-slate-300">
          <button
            type="button"
            onClick={() => {
              setMode('login')
              setError(null)
            }}
            className={`flex-1 rounded-full px-3 py-1 transition ${
              mode === 'login'
                ? 'bg-slate-950 text-slate-50 shadow-sm'
                : 'hover:text-slate-100'
            }`}
          >
            Log in
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup')
              setError(null)
            }}
            className={`flex-1 rounded-full px-3 py-1 transition ${
              mode === 'signup'
                ? 'bg-slate-950 text-slate-50 shadow-sm'
                : 'hover:text-slate-100'
            }`}
          >
            Sign up
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">
              Email address
            </label>
            <input
              type="email"
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none focus:border-emerald-500 focus:ring-1"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">
              Password
            </label>
            <input
              type="password"
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none focus:border-emerald-500 focus:ring-1"
              placeholder="At least 6 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete={
                mode === 'login' ? 'current-password' : 'new-password'
              }
            />
          </div>

          {mode === 'signup' && (
            <label className="mt-3 flex items-start gap-2 text-xs text-slate-300">
              <input
                type="checkbox"
                checked={agree}
                onChange={e => setAgree(e.target.checked)}
                className="mt-[2px] h-3 w-3 rounded border-slate-600 bg-slate-900"
              />
              <span>
                I commit to testing, giving feedback and requesting features during the beta.
              </span>
            </label>
          )}

          {error && (
            <div className="rounded-lg border border-red-500/60 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 inline-flex w-full items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-emerald-950 shadow-sm transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading
              ? mode === 'login'
                ? 'Logging you in…'
                : 'Creating your account…'
              : mode === 'login'
              ? 'Log in'
              : 'Request access'}
          </button>
        </form>

        <p className="mt-4 text-center text-[11px] text-slate-500">
          This is a private beta. Access requires approval.
        </p>
      </div>
    </main>
  )
}