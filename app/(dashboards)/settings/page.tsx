'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type UiSettings = {
  baseCurrency: string
  defaultRisk: string // in %
  defaultLotSize: string
  showWeekends: boolean
  dateFormat: 'NL' | 'US'
}

const SETTINGS_KEY = 'tradelyse-ui-settings'

export default function SettingsPage() {
  const router = useRouter()

  const [email, setEmail] = useState<string>('')
  const [createdAt, setCreatedAt] = useState<string>('')

  const [settings, setSettings] = useState<UiSettings>({
    baseCurrency: 'USD',
    defaultRisk: '1',
    defaultLotSize: '0.5',
    showWeekends: true,
    dateFormat: 'NL',
  })

  const [loadingUser, setLoadingUser] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  // ====== Load user + settings ======
  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser()
      const user = userData?.user
      if (!user) {
        router.push('/')
        return
      }

      setEmail(user.email ?? '')

      if (user.created_at) {
        const d = new Date(user.created_at)
        setCreatedAt(
          d.toLocaleString('en-US', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
        )
      }

      // Load UI settings from localStorage
      if (typeof window !== 'undefined') {
        const raw = window.localStorage.getItem(SETTINGS_KEY)
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as Partial<UiSettings>
            setSettings(prev => ({
              ...prev,
              ...parsed,
            }))
          } catch {
            // ignore corrupt settings
          }
        }
      }

      setLoadingUser(false)
    }

    load()
  }, [router])

  // ====== Handlers ======

  const handleSave = () => {
    setSaving(true)
    setSaveMessage(null)

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
    }

    setSaving(false)
    setSaveMessage('Settings saved.')
    setTimeout(() => setSaveMessage(null), 2500)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleChange =
    <K extends keyof UiSettings>(key: K) =>
    (value: UiSettings[K]) => {
      setSettings(prev => ({
        ...prev,
        [key]: value,
      }))
    }

  // ====== UI ======
  return (
    <div className="flex-1 px-6 py-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
          Settings
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Manage your account and trading preferences. For now, these settings are stored locally in your browser.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Account card */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 lg:col-span-1">
          <h2 className="text-sm font-medium text-slate-200">Account</h2>
          {loadingUser ? (
            <div className="mt-4 text-sm text-slate-500">Loading…</div>
          ) : (
            <>
              <div className="mt-4 space-y-3 text-sm">
                <div>
                  <div className="text-xs uppercase text-slate-500">
                    Email
                  </div>
                  <div className="mt-1 break-all font-medium text-slate-100">
                    {email}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase text-slate-500">
                    Account created
                  </div>
                  <div className="mt-1 text-slate-200">
                    {createdAt || '—'}
                  </div>
                </div>
              </div>

              {/* Logout area */}
              <div className="mt-5 border-t border-slate-800 pt-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Session
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      Log out from Tradelyse on this device.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="rounded-xl border border-slate-600 px-3 py-2 text-xs font-medium text-slate-100 hover:bg-slate-800"
                  >
                    Log out
                  </button>
                </div>
              </div>
            </>
          )}
        </section>

        {/* Trading settings */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 lg:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-medium text-slate-200">
              Trading settings
            </h2>
            {saveMessage && (
              <span className="text-xs text-emerald-400">{saveMessage}</span>
            )}
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {/* Base currency */}
            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">
                Base currency
              </label>
              <select
                value={settings.baseCurrency}
                onChange={e => handleChange('baseCurrency')(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="CHF">CHF</option>
              </select>
              <p className="mt-1 text-[11px] text-slate-500">
                Used for PnL display and future reports.
              </p>
            </div>

            {/* Default risk */}
            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">
                Default risk per trade (%)
              </label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={settings.defaultRisk}
                  onChange={e => handleChange('defaultRisk')(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
                />
                <span className="text-sm text-slate-400">%</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Useful as a reference for your risk management.
              </p>
            </div>

            {/* Default lot size */}
            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">
                Default lot size
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={settings.defaultLotSize}
                onChange={e => handleChange('defaultLotSize')(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Used later as the default for new trades.
              </p>
            </div>

            {/* Date format + weekends */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">
                  Date format
                </label>
                <select
                  value={settings.dateFormat}
                  onChange={e =>
                    handleChange('dateFormat')(
                      e.target.value as UiSettings['dateFormat'],
                    )
                  }
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
                >
                  <option value="NL">NL (dd-mm-yyyy)</option>
                  <option value="US">US (mm-dd-yyyy)</option>
                </select>
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={settings.showWeekends}
                  onChange={e =>
                    handleChange('showWeekends')(e.target.checked)
                  }
                  className="h-4 w-4 rounded border border-slate-600 bg-slate-900 text-emerald-500"
                />
                <span>Show weekends in profit calendar</span>
              </label>
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 shadow-sm hover:bg-emerald-400 disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save settings'}
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}