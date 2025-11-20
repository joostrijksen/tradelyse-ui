// app/(dashboards)/feedback/page.tsx
'use client'

import { useEffect, useMemo, useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type FeedbackItem = {
  id: string
  user_id: string
  category: 'bug' | 'idea' | 'question' | 'other' | null
  title: string
  description: string | null
  status: 'open' | 'planned' | 'in_progress' | 'done' | 'rejected' | null
  vote_count: number
  created_at: string
  updated_at: string
}

type FeedbackVote = {
  id: string
  feedback_id: string
  user_id: string
}

type FeedbackComment = {
  id: string
  feedback_id: string
  user_id: string
  body: string
  created_at: string
}

type NewFeedbackForm = {
  category: 'bug' | 'idea' | 'question' | 'other'
  title: string
  description: string
}

const initialForm: NewFeedbackForm = {
  category: 'idea',
  title: '',
  description: '',
}

type StatusFilter = 'all' | 'open' | 'planned' | 'in_progress' | 'done' | 'rejected'

const ADMIN_EMAIL = 'joostrijksen@me.com'

// ---- helpers ----

function formatDate(value: string) {
  const d = new Date(value)
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function statusLabel(status: FeedbackItem['status']) {
  switch (status) {
    case 'open':
      return 'Open'
    case 'planned':
      return 'Planned'
    case 'in_progress':
      return 'In progress'
    case 'done':
      return 'Done'
    case 'rejected':
      return 'Rejected'
    default:
      return 'Open'
  }
}

function statusClass(status: FeedbackItem['status']) {
  switch (status) {
    case 'done':
      return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
    case 'planned':
      return 'bg-sky-500/15 text-sky-300 border-sky-500/40'
    case 'in_progress':
      return 'bg-amber-500/15 text-amber-300 border-amber-500/40'
    case 'rejected':
      return 'bg-red-500/15 text-red-300 border-red-500/40'
    default:
      return 'bg-slate-700/30 text-slate-200 border-slate-600/50'
  }
}

function categoryLabel(cat: FeedbackItem['category']) {
  switch (cat) {
    case 'bug':
      return 'Bug'
    case 'idea':
      return 'Idea'
    case 'question':
      return 'Question'
    case 'other':
      return 'Other'
    default:
      return 'Idea'
  }
}

export default function FeedbackPage() {
  const router = useRouter()

  const [items, setItems] = useState<FeedbackItem[]>([])
  const [votes, setVotes] = useState<FeedbackVote[]>([])
  const [comments, setComments] = useState<FeedbackComment[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<NewFeedbackForm>(initialForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('open')

  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({})
  const [postingCommentFor, setPostingCommentFor] = useState<string | null>(null)
  const [updatingStatusFor, setUpdatingStatusFor] = useState<string | null>(null)

  // ---- load data ----
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)

      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser()

      if (userErr || !user) {
        router.push('/')
        return
      }

      setCurrentUserId(user.id)
      setIsAdmin(user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase())

      const [
        { data: feedbackData, error: feedbackErr },
        { data: votesData, error: votesErr },
        { data: commentsData, error: commentsErr },
      ] = await Promise.all([
        supabase
          .from('feedback')
          .select('*')
          .order('vote_count', { ascending: false })
          .order('created_at', { ascending: false }),
        supabase
          .from('feedback_votes')
          .select('*')
          .eq('user_id', user.id),
        supabase.from('feedback_comments').select('*'),
      ])

      if (feedbackErr) {
        console.error(feedbackErr)
        setError('Could not load feedback items.')
      } else {
        setItems((feedbackData ?? []) as FeedbackItem[])
      }

      if (votesErr) {
        console.error(votesErr)
      } else {
        setVotes((votesData ?? []) as FeedbackVote[])
      }

      if (commentsErr) {
        console.error(commentsErr)
      } else {
        setComments((commentsData ?? []) as FeedbackComment[])
      }

      setLoading(false)
    }

    load()
  }, [router])

  const votedIds = useMemo(
    () => new Set(votes.map(v => v.feedback_id)),
    [votes],
  )

  const filteredItems = useMemo(() => {
    if (statusFilter === 'all') return items
    return items.filter(item => (item.status ?? 'open') === statusFilter)
  }, [items, statusFilter])

  // ---- roadmap view (small board) ----
  const roadmap = useMemo(() => {
    const byStatus: Record<
      'planned' | 'in_progress' | 'done',
      FeedbackItem[]
    > = {
      planned: [],
      in_progress: [],
      done: [],
    }

    for (const item of items) {
      if (!item.status) continue
      if (item.status === 'planned') byStatus.planned.push(item)
      if (item.status === 'in_progress') byStatus.in_progress.push(item)
      if (item.status === 'done') byStatus.done.push(item)
    }

    // sort by votes desc
    ;(['planned', 'in_progress', 'done'] as const).forEach(key => {
      byStatus[key].sort((a, b) => (b.vote_count ?? 0) - (a.vote_count ?? 0))
    })

    return byStatus
  }, [items])

  // ---- form helpers ----
  const handleChange = (field: keyof NewFeedbackForm, value: string) => {
    setForm(prev => ({
      ...prev,
      [field]:
        field === 'category'
          ? (value as NewFeedbackForm['category'])
          : value,
    }))
    setError(null)
    setSuccess(null)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!form.title.trim()) {
      setError('Please enter a title.')
      return
    }

    setSaving(true)

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser()

    if (userErr || !user) {
      setSaving(false)
      router.push('/')
      return
    }

    const { data, error } = await supabase
      .from('feedback')
      .insert({
        user_id: user.id,
        category: form.category,
        title: form.title.trim(),
        description: form.description.trim() || null,
      })
      .select('*')
      .single()

    if (error) {
      console.error(error)
      setError('Could not submit your feedback. Please try again.')
    } else if (data) {
      setItems(prev => [data as FeedbackItem, ...prev])
      setForm(initialForm)
      setSuccess('Thanks! Your feedback has been submitted.')
    }

    setSaving(false)
  }

  // ---- voting ----
  const toggleVote = async (item: FeedbackItem) => {
    if (!currentUserId) return

    const hasVoted = votedIds.has(item.id)

    if (!hasVoted) {
      const { data: voteData, error: voteErr } = await supabase
        .from('feedback_votes')
        .insert({
          user_id: currentUserId,
          feedback_id: item.id,
        })
        .select('*')
        .single()

      if (voteErr) {
        console.error(voteErr)
        return
      }

      setVotes(prev => [...prev, voteData as FeedbackVote])

      const { error: updateErr } = await supabase
        .from('feedback')
        .update({
          vote_count: (item.vote_count ?? 0) + 1,
        })
        .eq('id', item.id)

      if (updateErr) {
        console.error(updateErr)
      } else {
        setItems(prev =>
          prev.map(f =>
            f.id === item.id
              ? { ...f, vote_count: (f.vote_count ?? 0) + 1 }
              : f,
          ),
        )
      }
    } else {
      const { error: deleteErr } = await supabase
        .from('feedback_votes')
        .delete()
        .eq('user_id', currentUserId)
        .eq('feedback_id', item.id)

      if (deleteErr) {
        console.error(deleteErr)
        return
      }

      setVotes(prev =>
        prev.filter(v => !(v.user_id === currentUserId && v.feedback_id === item.id)),
      )

      const { error: updateErr } = await supabase
        .from('feedback')
        .update({
          vote_count: Math.max((item.vote_count ?? 0) - 1, 0),
        })
        .eq('id', item.id)

      if (updateErr) {
        console.error(updateErr)
      } else {
        setItems(prev =>
          prev.map(f =>
            f.id === item.id
              ? { ...f, vote_count: Math.max((f.vote_count ?? 0) - 1, 0) }
              : f,
          ),
        )
      }
    }
  }

  // ---- admin: update status ----
  const updateStatus = async (item: FeedbackItem, next: FeedbackItem['status']) => {
    if (!isAdmin) return
    setUpdatingStatusFor(item.id)

    const { error } = await supabase
      .from('feedback')
      .update({ status: next })
      .eq('id', item.id)

    if (error) {
      console.error(error)
    } else {
      setItems(prev =>
        prev.map(f => (f.id === item.id ? { ...f, status: next } : f)),
      )
    }

    setUpdatingStatusFor(null)
  }

  // ---- comments ----
  const handleCommentDraftChange = (feedbackId: string, value: string) => {
    setCommentDrafts(prev => ({
      ...prev,
      [feedbackId]: value,
    }))
  }

  const submitComment = async (feedbackId: string) => {
    const body = (commentDrafts[feedbackId] || '').trim()
    if (!body || !currentUserId) return

    setPostingCommentFor(feedbackId)

    const { data, error } = await supabase
      .from('feedback_comments')
      .insert({
        feedback_id: feedbackId,
        user_id: currentUserId,
        body,
      })
      .select('*')
      .single()

    if (error) {
      console.error(error)
    } else if (data) {
      setComments(prev => [...prev, data as FeedbackComment])
      setCommentDrafts(prev => ({
        ...prev,
        [feedbackId]: '',
      }))
    }

    setPostingCommentFor(null)
  }

  const statusTabs: { value: StatusFilter; label: string }[] = [
    { value: 'open', label: 'Open' },
    { value: 'planned', label: 'Planned' },
    { value: 'in_progress', label: 'In progress' },
    { value: 'done', label: 'Done' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'all', label: 'All' },
  ]

  // ---- render ----
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header className="mb-2">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
          Feedback & roadmap
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Share bugs, ideas and questions about Tradelyse. We use this board to decide what to build next.
        </p>
      </header>

      {/* New feedback form */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <h2 className="text-sm font-medium text-slate-200">
          Submit feedback
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Tell us what you’d like to see in Tradelyse or what’s not working as expected.
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid gap-3 md:grid-cols-[160px,1fr]">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400">
                Category
              </label>
              <select
                className="h-9 w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 text-sm text-slate-100 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                value={form.category}
                onChange={e => handleChange('category', e.target.value)}
              >
                <option value="idea">Idea</option>
                <option value="bug">Bug</option>
                <option value="question">Question</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400">
                Title
              </label>
              <input
                className="h-9 w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 text-sm text-slate-100 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                placeholder="Short summary of your idea or bug"
                value={form.title}
                onChange={e => handleChange('title', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-400">
              Description (optional)
            </label>
            <textarea
              className="min-h-[80px] w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              placeholder="Tell us more. What problem are you trying to solve? How would this help your trading?"
              value={form.description}
              onChange={e => handleChange('description', e.target.value)}
            />
          </div>

          {error && (
            <p className="text-xs text-red-400">{error}</p>
          )}
          {success && (
            <p className="text-xs text-emerald-400">{success}</p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="mt-1 inline-flex items-center justify-center rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-emerald-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Submitting…' : 'Submit feedback'}
          </button>
        </form>
      </section>

      {/* Small roadmap view */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-slate-200">Roadmap overview</h2>
          <span className="text-xs text-slate-500">
            Most upvoted items per status
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-3 text-xs">
          {(['planned', 'in_progress', 'done'] as const).map(col => {
            const title =
              col === 'planned'
                ? 'Planned'
                : col === 'in_progress'
                ? 'In progress'
                : 'Done'
            const itemsForCol = roadmap[col].slice(0, 4)

            return (
              <div
                key={col}
                className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    {title}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {roadmap[col].length} item
                    {roadmap[col].length === 1 ? '' : 's'}
                  </span>
                </div>

                {itemsForCol.length === 0 ? (
                  <p className="text-[11px] text-slate-500">No items yet.</p>
                ) : (
                  <ul className="space-y-1 text-[11px]">
                    {itemsForCol.map(item => (
                      <li
                        key={item.id}
                        className="flex items-center justify-between gap-2 rounded-lg bg-slate-900/80 px-2 py-1"
                      >
                        <span className="truncate text-slate-100">
                          {item.title}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          ▲ {item.vote_count}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* Status filters + list */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {statusTabs.map(tab => {
              const isActive = statusFilter === tab.value
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setStatusFilter(tab.value)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    isActive
                      ? 'bg-emerald-500 text-emerald-950'
                      : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>
          <span className="text-xs text-slate-500">
            {filteredItems.length === 0
              ? 'No feedback items in this view.'
              : `${filteredItems.length} item${
                  filteredItems.length === 1 ? '' : 's'
                }`}
          </span>
        </div>

        {loading ? (
          <div className="flex h-24 items-center justify-center text-sm text-slate-500">
            Loading…
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex h-24 items-center justify-center text-sm text-slate-500">
            No feedback yet for this status.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map(item => {
              const isVoted = votedIds.has(item.id)
              const itemComments = comments
                .filter(c => c.feedback_id === item.id)
                .sort(
                  (a, b) =>
                    new Date(a.created_at).getTime() -
                    new Date(b.created_at).getTime(),
                )
              const draft = commentDrafts[item.id] ?? ''

              return (
                <article
                  key={item.id}
                  className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm md:flex-row"
                >
                  {/* Vote button */}
                  <div className="flex w-16 flex-none items-start justify-center">
                    <button
                      type="button"
                      onClick={() => toggleVote(item)}
                      className={`flex w-14 flex-col items-center justify-center rounded-lg border text-xs font-medium transition ${
                        isVoted
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                          : 'border-slate-700 bg-slate-900/80 text-slate-300 hover:border-emerald-400/70 hover:text-emerald-300'
                      }`}
                    >
                      <span className="text-base leading-none">▲</span>
                      <span className="mt-1">{item.vote_count}</span>
                    </button>
                  </div>

                  {/* Content */}
                  <div className="flex-1 space-y-3">
                    <div>
                      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center rounded-full bg-slate-800/80 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-300">
                            {categoryLabel(item.category)}
                          </span>

                          {/* status pill or admin dropdown */}
                          {isAdmin ? (
                            <select
                              value={item.status ?? 'open'}
                              disabled={updatingStatusFor === item.id}
                              onChange={e =>
                                updateStatus(
                                  item,
                                  e.target.value as FeedbackItem['status'],
                                )
                              }
                              className={`h-6 rounded-full border px-2 text-[10px] font-medium uppercase tracking-wide ${statusClass(
                                item.status,
                              )}`}
                            >
                              <option value="open">Open</option>
                              <option value="planned">Planned</option>
                              <option value="in_progress">In progress</option>
                              <option value="done">Done</option>
                              <option value="rejected">Rejected</option>
                            </select>
                          ) : (
                            <span
                              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${statusClass(
                                item.status,
                              )}`}
                            >
                              {statusLabel(item.status)}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500">
                          {formatDate(item.created_at)}
                        </span>
                      </div>

                      <h3 className="text-sm font-semibold text-slate-100">
                        {item.title}
                      </h3>

                      {item.description && (
                        <p className="mt-1 text-xs text-slate-300">
                          {item.description}
                        </p>
                      )}
                    </div>

                    {/* comments */}
                    <div className="border-t border-slate-800 pt-2 text-xs">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                          Comments ({itemComments.length})
                        </span>
                      </div>

                      {itemComments.length > 0 && (
                        <div className="mb-2 max-h-28 space-y-1 overflow-y-auto pr-1">
                          {itemComments.map(c => (
                            <div
                              key={c.id}
                              className="rounded-md bg-slate-900/80 px-2 py-1 text-[11px] text-slate-100"
                            >
                              <span className="block">
                                {c.body}
                              </span>
                              <span className="mt-0.5 block text-[10px] text-slate-500">
                                {formatDate(c.created_at)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="mt-1 flex gap-2">
                        <input
                          type="text"
                          placeholder="Add a short comment…"
                          className="flex-1 rounded-lg border border-slate-700 bg-slate-900/80 px-2 py-1 text-[11px] text-slate-100 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                          value={draft}
                          onChange={e =>
                            handleCommentDraftChange(item.id, e.target.value)
                          }
                        />
                        <button
                          type="button"
                          onClick={() => submitComment(item.id)}
                          disabled={
                            !draft.trim() || postingCommentFor === item.id
                          }
                          className="inline-flex items-center justify-center rounded-lg bg-slate-800 px-3 py-1 text-[11px] font-medium text-slate-100 hover:bg-emerald-500 hover:text-emerald-950 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {postingCommentFor === item.id
                            ? 'Sending…'
                            : 'Send'}
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}