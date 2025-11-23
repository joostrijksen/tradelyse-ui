'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type Profile = {
  id: string
  email: string | null
  is_approved: boolean | null
  created_at: string | null
}

const ADMIN_EMAIL = 'joostrijksen@me.com' // <-- eventueel aanpassen

function formatDate(value: string | null) {
  if (!value) return '—'
  const d = new Date(value)
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function AdminPage() {
  const router = useRouter()

  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionId, setActionId] = useState<string | null>(null)

  // Check of jij bent ingelogd + data laden
  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser()

      if (userErr || !user) {
        router.push('/login')
        return
      }

      // Alleen jouw account mag in de admin
      if (user.email !== ADMIN_EMAIL) {
        router.push('/')
        return
      }

      setAuthChecked(true)
      setLoading(true)
      setError(null)

      const { data, error: profilesErr } = await supabase
        .from('profiles')
        .select('id, email, is_approved, created_at')
        .order('created_at', { ascending: true })

      if (profilesErr) {
        console.error(profilesErr)
        setError('Kon gebruikers niet laden.')
      } else {
        setProfiles((data ?? []) as Profile[])
      }

      setLoading(false)
    }

    load()
  }, [router])

  const pending = profiles.filter(p => !p.is_approved)
  const approved = profiles.filter(p => p.is_approved)

  const handleSetApproval = async (id: string, approved: boolean) => {
    setActionId(id)
    setError(null)

    // Alleen Supabase updaten en lokale state bijwerken – geen e-mail meer
    const { error } = await supabase
      .from('profiles')
      .update({ is_approved: approved })
      .eq('id', id)

    if (error) {
      console.error(error)
      setError('Updaten van gebruiker is mislukt.')
    } else {
      setProfiles(prev =>
        prev.map(p =>
          p.id === id ? { ...p, is_approved: approved } : p,
        ),
      )
    }

    setActionId(null)
  }

  if (!authChecked) {
    // even niks laten zien tot we weten of je admin bent
    return null
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">
            Early access admin
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Approve of blokkeer accounts voor de Tradelyse early adopter groep.
          </p>
        </header>

        {error && (
          <div className="mb-4 rounded-xl border border-red-600/60 bg-red-500/10 px-4 py-3 text-xs text-red-200">
            {error}
          </div>
        )}

        {/* Pending approvals */}
        <section className="mb-8 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-100">
              Wacht op goedkeuring
            </h2>
            <span className="text-xs text-slate-400">
              {pending.length} account
              {pending.length === 1 ? '' : 's'}
            </span>
          </div>

          {loading ? (
            <p className="text-sm text-slate-500">Laden…</p>
          ) : pending.length === 0 ? (
            <p className="text-sm text-slate-500">
              Geen accounts in de wachtrij.
            </p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-800/70">
              <table className="min-w-full text-xs">
                <thead className="bg-slate-900/80 text-slate-400">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium">
                      Email
                    </th>
                    <th className="px-4 py-2 text-left font-medium">
                      Aangemaakt
                    </th>
                    <th className="px-4 py-2 text-right font-medium">
                      Actie
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-950/50">
                  {pending.map(p => (
                    <tr key={p.id}>
                      <td className="px-4 py-2 text-slate-100">
                        {p.email ?? '—'}
                      </td>
                      <td className="px-4 py-2 text-slate-400">
                        {formatDate(p.created_at)}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => handleSetApproval(p.id, true)}
                          disabled={actionId === p.id}
                          className="inline-flex items-center rounded-lg bg-emerald-500 px-3 py-1.5 text-[11px] font-medium text-emerald-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {actionId === p.id
                            ? 'Bezig…'
                            : 'Approve & toegang geven'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Approved users */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-100">
              Goedgekeurde early adopters
            </h2>
            <span className="text-xs text-slate-400">
              {approved.length} actief
            </span>
          </div>

          {loading ? (
            <p className="text-sm text-slate-500">Laden…</p>
          ) : approved.length === 0 ? (
            <p className="text-sm text-slate-500">
              Nog geen goedgekeurde users.
            </p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-800/70">
              <table className="min-w-full text-xs">
                <thead className="bg-slate-900/80 text-slate-400">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium">
                      Email
                    </th>
                    <th className="px-4 py-2 text-left font-medium">
                      Goedgekeurd sinds
                    </th>
                    <th className="px-4 py-2 text-right font-medium">
                      Actie
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-950/50">
                  {approved.map(p => (
                    <tr key={p.id}>
                      <td className="px-4 py-2 text-slate-100">
                        {p.email ?? '—'}
                      </td>
                      <td className="px-4 py-2 text-slate-400">
                        {formatDate(p.created_at)}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => handleSetApproval(p.id, false)}
                          disabled={actionId === p.id}
                          className="inline-flex items-center rounded-lg border border-slate-700 px-3 py-1.5 text-[11px] font-medium text-slate-200 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {actionId === p.id
                            ? 'Bezig…'
                            : 'Toegang intrekken'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}