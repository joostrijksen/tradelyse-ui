'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type Mode = 'login' | 'signup'

export default function AuthPage() {
  const router = useRouter()

  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)

    if (!email || !password) {
      setError('Please enter both your email and a password.')
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
        } else {
          setMessage(
            'Account created. Check your inbox if email confirmation is required.',
          )

          const { data: userData } = await supabase.auth.getUser()
          if (userData.user) {
            router.push('/dashboard')
          }
        }
      } else {
        const { error: signInError } =
          await supabase.auth.signInWithPassword({
            email,
            password,
          })

        if (signInError) {
          setError(signInError.message)
        } else {
          router.push('/dashboard')
        }
      }
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong, please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-xl">
        {/* Logo / title */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
            T
          </div>
          <h1 className="text-xl font-semibold text-slate-50">
            Tradelyse
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            {mode === 'login'
              ? 'Log in to your trading journal.'
              : 'Create an account and start journaling your trades automatically.'}
          </p>
        </div>

        {/* Tabs login / signup */}
        <div className="mb-6 flex rounded-full bg-slate-800/60 p-1 text-xs font-medium text-slate-300">
          <button
            type="button"
            onClick={() => {
              setMode('login')
              setError(null)
              setMessage(null)
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
              setMessage(null)
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
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none ring-emerald-500/40 placeholder:text-slate-500 focus:border-emerald-500 focus:ring-1"
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
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none ring-emerald-500/40 placeholder:text-slate-500 focus:border-emerald-500 focus:ring-1"
              placeholder="At least 6 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete={
                mode === 'login' ? 'current-password' : 'new-password'
              }
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/60 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {error}
            </div>
          )}

          {message && !error && (
            <div className="rounded-lg border border-emerald-500/60 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
              {message}
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
              : 'Sign up'}
          </button>
        </form>

        <p className="mt-4 text-center text-[11px] text-slate-500">
          Your account is managed via Supabase. Never share your password with
          anyone.
        </p>
      </div>
    </main>
  )
}