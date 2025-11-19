'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type ApiKey = {
  id: string
  user_id: string | null
  name: string
  key: string
  created_at: string
  last_used_at: string | null
  revoked_at: string | null
}

type StatusMessage = {
  type: 'success' | 'error'
  text: string
} | null

// Helper: mooi datum-format
function formatDate(value: string | null) {
  if (!value) return '—'
  const d = new Date(value)
  return d.toLocaleString('nl-NL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Helper: mask key voor weergave
function maskKey(key: string) {
  if (key.length <= 8) return key
  const start = key.slice(0, 4)
  const end = key.slice(-4)
  return `${start}…${end}`
}

// Helper: generate random API key
function generateApiKey() {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().replace(/-/g, '')
      : Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)

  return `trj_live_${random.slice(0, 32)}`
}

export default function ApiKeysPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [revokingId, setRevokingId] = useState<string | null>(null)
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [newKeyName, setNewKeyName] = useState('')
  const [status, setStatus] = useState<StatusMessage>(null)
  const [justCreatedKey, setJustCreatedKey] = useState<string | null>(null)
  const [copyingId, setCopyingId] = useState<string | null>(null)

  // ----- load keys on mount -----
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data: userData } = await supabase.auth.getUser()
      const user = userData?.user
      if (!user) {
        router.push('/')
        return
      }

      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error(error)
        setStatus({
          type: 'error',
          text: 'Kon API keys niet ophalen. Probeer het later opnieuw.',
        })
      } else {
        setApiKeys((data ?? []) as ApiKey[])
      }

      setLoading(false)
    }

    load()
  }, [router])

  // ----- create new key -----
  const handleCreateKey = async () => {
    if (!newKeyName.trim()) {
      setStatus({
        type: 'error',
        text: 'Geef eerst een naam aan je API key.',
      })
      return
    }

    setCreating(true)
    setStatus(null)

    try {
      const fullKey = generateApiKey()

      const { data: userData } = await supabase.auth.getUser()
      const user = userData?.user
      if (!user) {
        router.push('/')
        return
      }

      const { data, error } = await supabase
        .from('api_keys')
        .insert({
          user_id: user.id,
          name: newKeyName.trim(),
          key: fullKey,
        })
        .select('*')
        .single()

      if (error || !data) {
        console.error(error)
        setStatus({
          type: 'error',
          text: 'Er ging iets mis bij het aanmaken van de API key.',
        })
        return
      }

      // Voeg bovenaan toe
      setApiKeys(prev => [data as ApiKey, ...prev])
      setNewKeyName('')
      setJustCreatedKey(fullKey)
      setStatus({
        type: 'success',
        text: 'API key created. Copy it and store it in a safe place.',
      })
    } finally {
      setCreating(false)
    }
  }

  // ----- revoke key -----
  const handleRevoke = async (id: string) => {
    setRevokingId(id)
    setStatus(null)
    try {
      const { error } = await supabase
        .from('api_keys')
        .update({ revoked_at: new Date().toISOString() })
        .eq('id', id)

      if (error) {
        console.error(error)
        setStatus({
          type: 'error',
          text: 'Kon de key niet intrekken.',
        })
        return
      }

      setApiKeys(prev =>
        prev.map(k => (k.id === id ? { ...k, revoked_at: new Date().toISOString() } : k)),
      )
      setStatus({
        type: 'success',
        text: 'API key is ingetrokken.',
      })
    } finally {
      setRevokingId(null)
    }
  }

  // ----- copy key -----
  const handleCopy = async (key: string, id: string) => {
    try {
      setCopyingId(id)
      await navigator.clipboard.writeText(key)
      setStatus({
        type: 'success',
        text: 'API key copied to your clipboard.',
      })
    } catch (e) {
      console.error(e)
      setStatus({
        type: 'error',
        text: 'Could not copy the key.',
      })
    } finally {
      setCopyingId(null)
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <header className="mb-2">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
          API keys
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Manage your API keys for n8n and other integrations here. These keys grant access to your journal data, so treat them as securely as you would a password.
        </p>
      </header>

      {/* Status message */}
      {status && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            status.type === 'success'
              ? 'border-emerald-600/60 bg-emerald-500/10 text-emerald-200'
              : 'border-red-600/60 bg-red-500/10 text-red-200'
          }`}
        >
          {status.text}
        </div>
      )}

      {/* Nieuwe key aanmaken */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <div className="mb-3 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-medium text-slate-200">
              Generate new API key
            </h2>
            <p className="text-xs text-slate-500">
              Give your key a recognizable name e.g.{' '}
              <span className="font-semibold text-slate-300">&quot;n8n live&quot;</span> of{' '}
              <span className="font-semibold text-slate-300">&quot;development&quot;</span>.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 md:flex-row">
          <input
            type="text"
            placeholder="Key name"
            value={newKeyName}
            onChange={e => setNewKeyName(e.target.value)}
            className="flex-1 rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-emerald-500"
          />
          <button
            onClick={handleCreateKey}
            disabled={creating}
            className="mt-1 inline-flex items-center justify-center rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-emerald-950 shadow-sm hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60 md:mt-0"
          >
            {creating ? 'Bezig…' : 'Make API key'}
          </button>
        </div>

        {justCreatedKey && (
          <div className="mt-4 rounded-xl border border-emerald-700/70 bg-emerald-900/30 px-3 py-3 text-xs text-emerald-100">
            <div className="mb-1 font-medium">
              New key created — copy it now, as you won’t be able to see it in full again.
            </div>
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <code className="break-all rounded bg-black/40 px-2 py-1 text-[11px]">
                {justCreatedKey}
              </code>
              <button
                onClick={() => handleCopy(justCreatedKey, 'new')}
                className="mt-1 inline-flex items-center justify-center rounded-lg border border-emerald-500/60 px-3 py-1.5 text-[11px] font-medium text-emerald-200 hover:bg-emerald-500/10 md:mt-0"
              >
                Copy key
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Overzicht bestaande keys */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-slate-200">Your API keys</h2>
          <span className="text-xs text-slate-500">
            Totaal: {apiKeys.length}{' '}
            {apiKeys.length === 1 ? 'key' : 'keys'}
          </span>
        </div>

        {loading ? (
          <div className="flex h-24 items-center justify-center text-sm text-slate-500">
            Laden…
          </div>
        ) : apiKeys.length === 0 ? (
          <div className="flex h-24 items-center justify-center text-sm text-slate-500">
            No API keys created yet.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-800/80">
            <table className="min-w-full divide-y divide-slate-800/80 text-xs">
              <thead className="bg-slate-900/80 text-slate-400">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Name</th>
                  <th className="px-4 py-2 text-left font-medium">Key</th>
                  <th className="px-4 py-2 text-left font-medium">Created</th>
                  <th className="px-4 py-2 text-left font-medium">Last used</th>
                  <th className="px-4 py-2 text-left font-medium">Status</th>
                  <th className="px-4 py-2 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 bg-slate-950/40">
                {apiKeys.map(key => {
                  const isRevoked = !!key.revoked_at
                  return (
                    <tr key={key.id} className="hover:bg-slate-900/60">
                      <td className="px-4 py-2 text-slate-100">{key.name}</td>
                      <td className="px-4 py-2 font-mono text-[11px] text-slate-300">
                        {maskKey(key.key)}
                      </td>
                      <td className="px-4 py-2 text-slate-400">
                        {formatDate(key.created_at)}
                      </td>
                      <td className="px-4 py-2 text-slate-400">
                        {formatDate(key.last_used_at)}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            isRevoked
                              ? 'bg-red-500/10 text-red-300'
                              : 'bg-emerald-500/10 text-emerald-300'
                          }`}
                        >
                          {isRevoked ? 'Ingetrokken' : 'Actief'}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleCopy(key.key, key.id)}
                            disabled={copyingId === key.id}
                            className="rounded-lg border border-slate-700 px-2 py-1 text-[11px] text-slate-200 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {copyingId === key.id ? 'Copy…' : 'Copy key'}
                          </button>
                          <button
                            onClick={() => handleRevoke(key.id)}
                            disabled={isRevoked || revokingId === key.id}
                            className="rounded-lg border border-red-700/80 px-2 py-1 text-[11px] text-red-200 hover:bg-red-900/40 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {revokingId === key.id ? 'Revoke…' : 'Revoke'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* (optioneel) klein doc-blokje */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-[11px] text-slate-400">
        <div className="font-medium text-slate-200">How to use your API key?</div>
        <p className="mt-1">
          Use your key in the <span className="font-mono">Authorization</span>-header of your HTTP requests, for example in n8n.
        </p>
        <pre className="mt-2 overflow-x-auto rounded-lg bg-black/40 p-3 font-mono text-[10px] text-slate-200">
{`GET https://jouw-api-endpoint.example.com/trades
Authorization: Bearer YOUR_API_KEY_HERE`}
        </pre>
      </section>
    </div>
  )
}