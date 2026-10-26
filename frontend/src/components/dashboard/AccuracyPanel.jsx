const ranges = [
  { label: 'Under 2%', color: 'bg-emerald-500' },
  { label: '2–5%', color: 'bg-sky-500' },
  { label: '5–10%', color: 'bg-amber-400' },
  { label: 'Over 10%', color: 'bg-rose-400' },
]

export default function AccuracyPanel({ mape, bias, matched, total, buckets }) {
  return (
    <section className="min-w-0 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_2px_10px_rgba(31,55,88,0.035)] sm:p-5">
      <div className="flex items-start justify-between"><div><h2 className="text-[12px] font-semibold text-slate-800">Forecast accuracy</h2><p className="mt-1 text-[10px] text-slate-400">Absolute percentage error · selected day</p></div><span className="rounded-md bg-slate-50 px-2 py-1 text-[10px] font-medium text-slate-500">{matched.length}/{total} hrs</span></div>
      <div className="mt-4 flex items-end gap-1.5"><p className="text-[27px] font-semibold leading-none tracking-[-0.045em] text-slate-900 tabular-nums">{mape === null ? '—' : mape.toFixed(1)}</p><span className="pb-0.5 text-[13px] font-medium text-slate-400">%</span></div>
      <p className="mt-1 text-[10px] text-slate-400">Mean absolute percentage error</p>
      <div className="mt-5 space-y-2">{ranges.map((range, index) => {
        const percent = matched.length ? Math.round((buckets[index] / matched.length) * 100) : 0
        return <div key={range.label} className="flex items-center gap-2"><span className={`h-1.5 w-1.5 shrink-0 rounded-full ${range.color}`} /><span className="w-14 text-[10px] text-slate-500">{range.label}</span><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${range.color}`} style={{ width: `${percent}%` }} /></div><span className="w-7 text-right text-[10px] font-semibold tabular-nums text-slate-600">{percent}%</span></div>
      })}</div>
      <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3"><div><p className="text-[10px] text-slate-400">Forecast bias</p><p className="mt-0.5 text-[12px] font-semibold text-slate-800 tabular-nums">{bias === null ? '—' : `${bias > 0 ? '+' : ''}${Math.round(bias).toLocaleString('en-GB')}`} <span className="text-[10px] font-medium text-slate-400">MW</span></p></div><div><p className="text-[10px] text-slate-400">Data coverage</p><p className="mt-0.5 text-[12px] font-semibold text-slate-800 tabular-nums">{total ? `${Math.round((matched.length / total) * 100)}%` : '—'}</p></div></div>
    </section>
  )
}
