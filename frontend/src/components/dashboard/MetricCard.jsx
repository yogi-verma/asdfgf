export default function MetricCard({ icon: Icon, label, value, unit, note, tone = 'green' }) {
  const colors = {
    green: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100',
    blue: 'bg-sky-50 text-sky-700 ring-1 ring-sky-100',
    amber: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100',
  }
  return (
    <article className="group min-w-0 rounded-2xl border border-slate-200/80 bg-white px-4 py-4 shadow-sm shadow-slate-900/[0.025] transition hover:-translate-y-0.5 hover:shadow-md hover:shadow-slate-900/[0.05] sm:px-5 sm:py-5">
      <div className="flex items-center gap-2">
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${colors[tone]}`}><Icon size={17} strokeWidth={1.8} /></span>
        <h2 className="truncate text-[12px] font-semibold text-slate-600">{label}</h2>
      </div>
      <p className="mt-4 flex items-baseline gap-2"><span className="truncate text-[29px] font-semibold leading-none tracking-[-0.045em] text-slate-950 tabular-nums">{value}</span><span className="shrink-0 text-[12px] font-medium text-slate-400">{unit}</span></p>
      <p className="mt-2 truncate text-[11px] text-slate-500">{note}</p>
    </article>
  )
}
