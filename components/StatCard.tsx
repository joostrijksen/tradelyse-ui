// app/components/StatCard.tsx
type StatCardProps = {
  label: string
  value: string
  sub?: string
  positive?: boolean
}

export default function StatCard({ label, value, sub, positive }: StatCardProps) {
  const color =
    positive === undefined ? 'text-slate-50' : positive ? 'text-emerald-400' : 'text-red-400'

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
      <div className="text-xs font-medium text-slate-400 uppercase tracking-wide">
        {label}
      </div>
      <div className={`mt-2 text-2xl font-semibold ${color}`}>{value}</div>
      {sub && <div className="mt-1 text-xs text-slate-500">{sub}</div>}
    </div>
  )
}