export default function MetricCard({ icon: Icon, label, value, unit, note, tone = 'green' }) {
  const colors = {
    green: 'bg-emerald-50 text-emerald-700',
    blue: 'bg-sky-50 text-sky-700',
    amber: 'bg-amber-50 text-amber-700',
  }
  return (
    <article className="min-w-0 rounded-lg border border-slate-200/80 bg-white px-3.5 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.03)] sm:px-4">
      <div className="flex items-center gap-2">
        <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-md ${colors[tone]}`}><Icon size={14} /></span>
        <h2 className="truncate text-[10px] font-semibold text-slate-500">{label}</h2>
      </div>
      <p className="mt-2.5 flex items-baseline gap-1.5"><span className="truncate text-[21px] font-semibold leading-none tracking-[-0.045em] text-slate-900 tabular-nums">{value}</span><span className="shrink-0 text-[10px] font-medium text-slate-400">{unit}</span></p>
      <p className="mt-1.5 truncate text-[9px] text-slate-400">{note}</p>
    </article>
  )
}
